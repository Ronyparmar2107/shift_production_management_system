/* =====================================================================
   SPMS - 001: plan status, who-did-what, shift status, variance columns
   Run order: LOCAL first, check the verification block at the bottom,
   then Azure SQL. Safe to re-run (idempotent).

   1. plan_master.status            (Pending / Accepted / Updated)
   2. variance_config               (thresholds live in a table, never hardcoded)
   3. v_plan_variance               (extended - every OLD column kept, same names)
   ===================================================================== */

/* ---------- 1. plan_master.status ---------- */
IF COL_LENGTH('dbo.plan_master', 'status') IS NULL
BEGIN
    ALTER TABLE dbo.plan_master
        ADD [status] VARCHAR(20) NOT NULL
            CONSTRAINT DF_plan_master_status DEFAULT ('Pending');
END
GO

-- Backfill from the existing flags (is_accepted / is_updated are KEPT)
UPDATE dbo.plan_master
SET [status] = CASE
                   WHEN is_accepted = 1 AND is_updated = 1 THEN 'Updated'
                   WHEN is_accepted = 1                    THEN 'Accepted'
                   ELSE 'Pending'
               END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_plan_master_status')
BEGIN
    ALTER TABLE dbo.plan_master
        ADD CONSTRAINT CK_plan_master_status
            CHECK ([status] IN ('Pending', 'Accepted', 'Updated'));
END
GO

/* ---------- 2. variance_config ---------- */
IF OBJECT_ID('dbo.variance_config', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.variance_config (
        config_key   VARCHAR(50)    NOT NULL CONSTRAINT PK_variance_config PRIMARY KEY,
        config_value DECIMAL(18, 4) NOT NULL,
        description  VARCHAR(200)   NULL
    );
END
GO

MERGE dbo.variance_config AS t
USING (VALUES
    ('yellow_pct',            5,   'Behind by more than this % = Yellow (inclusive: exactly 5 is still Green)'),
    ('red_pct',               15,  'Behind by more than this % = Red (inclusive: exactly 15 is still Yellow)'),
    ('stale_minutes',         60,  'No actual entry for this many minutes = Stale'),
    ('min_pct_minutes',       5,   'Hide variance % until this many minutes into the plan window'),
    ('min_projection_minutes',20,  'Hide projected finish until this many minutes into the plan window'),
    ('plan_time_offset_minutes', 0,'Added to UTC to compare against planned_start/end (see note below)')
) AS s (config_key, config_value, description)
ON t.config_key = s.config_key
WHEN NOT MATCHED THEN
    INSERT (config_key, config_value, description)
    VALUES (s.config_key, s.config_value, s.description);
GO

/* ---------- 3. v_plan_variance ----------
   OLD columns (unchanged names/order, EF PlanView + ActualsService depend on them):
     plan_id, target, planned_start, planned_end, is_accepted, type, unit,
     shift_date, shift_type, area_name, lead_emp_id, crew_id, emp_name,
     actual_value, actuals_logged_at
   NEW columns are appended after them.

   shift_status comes from shift_logs (latest control entry, ordered by id because
   shift_logs.created_at is a DATE with no time):
       log_type 'ShiftStart' -> Running
       log_type 'ShiftEnd'   -> Ended
       neither               -> NotStarted
   (OnShift/OffShift clock events are ignored here.)
*/
CREATE OR ALTER VIEW dbo.v_plan_variance
AS
SELECT
    /* ---- existing columns ---- */
    p.id                     AS plan_id,
    p.target,
    p.planned_start,
    p.planned_end,
    p.is_accepted,
    pt.type,
    pt.unit,
    sm.date                  AS shift_date,
    sm.type                  AS shift_type,
    am.area_name,
    cm.lead_emp_id,
    cm.id                    AS crew_id,
    em.name                  AS emp_name,
    latest.value             AS actual_value,
    latest.created_at        AS actuals_logged_at,

    /* ---- status + who did what ---- */
    p.[status]               AS status,
    p.shift_id,
    p.created_by,
    cby.name                 AS created_by_name,
    p.created_at             AS plan_created_at,
    p.accepted_by,
    aby.name                 AS accepted_by_name,
    p.accepted_at,
    p.updated_by,
    uby.name                 AS updated_by_name,
    p.updated_at,

    /* ---- shift state ---- */
    COALESCE(ctl.shift_status, 'NotStarted') AS shift_status,
    sm.start_time            AS shift_started_at,
    sm.end_time              AS shift_ended_at,

    /* ---- variance tracking ---- */
    c.as_of,
    c.actual_num             AS actual,
    c.expected,
    c.actual_num - c.expected AS variance_units,

    -- hidden (NULL) when expected = 0 or in the first minutes of the window
    CASE WHEN c.expected = 0 OR c.elapsed_sec < cfg.min_pct_minutes * 60
         THEN NULL
         ELSE c.pct_raw
    END                      AS variance_pct,

    CASE
        WHEN ISNULL(p.is_accepted, 0) = 0 THEN 'Awaiting acceptance'
        WHEN c.expected = 0               THEN 'Not started'
        WHEN latest.created_at IS NOT NULL
             AND c.as_of < p.planned_end
             AND DATEDIFF(MINUTE, latest.created_at, GETUTCDATE()) >= cfg.stale_minutes
                                          THEN 'Stale'
        WHEN c.pct_raw >= -cfg.yellow_pct THEN 'Green'
        WHEN c.pct_raw >= -cfg.red_pct    THEN 'Yellow'
        ELSE 'Red'
    END                      AS variance_status,

    CASE WHEN latest.created_at IS NULL THEN NULL
         ELSE DATEDIFF(MINUTE, latest.created_at, GETUTCDATE())
    END                      AS minutes_since_update,

    -- projection: accepted + shift running + inside window + past warm-up
    proj.projected_end,
    CASE WHEN proj.projected_end IS NULL THEN NULL
         ELSE p.target - proj.projected_end
    END                      AS projected_shortfall

FROM dbo.plan_master p
JOIN      dbo.plan_type_master pt ON pt.id = p.type_id
JOIN      dbo.area_master      am ON am.id = p.area_id
LEFT JOIN dbo.crew_master      cm ON cm.id = p.crew_id
LEFT JOIN dbo.emp_master       em ON em.id = cm.lead_emp_id
LEFT JOIN dbo.shift_master     sm ON sm.id = p.shift_id
LEFT JOIN dbo.emp_master      cby ON cby.id = p.created_by
LEFT JOIN dbo.emp_master      aby ON aby.id = p.accepted_by
LEFT JOIN dbo.emp_master      uby ON uby.id = p.updated_by

-- latest non-deleted actual (entries are cumulative)
OUTER APPLY (
    SELECT TOP 1 al.value, al.created_at
    FROM dbo.actual_logs al
    WHERE al.plan_id = p.id AND al.is_deleted = 0
    ORDER BY al.created_at DESC, al.id DESC
) latest

-- latest shift START/END control entry
OUTER APPLY (
    SELECT TOP 1 CASE sl.log_type WHEN 'ShiftStart' THEN 'Running' ELSE 'Ended' END AS shift_status
    FROM dbo.shift_logs sl
    WHERE sl.shift_id = p.shift_id
      AND sl.is_deleted = 0
      AND sl.log_type IN ('ShiftStart', 'ShiftEnd')
    ORDER BY sl.id DESC
) ctl

-- thresholds from variance_config (defaults if a row is missing)
CROSS APPLY (
    SELECT
        ISNULL(MAX(CASE WHEN config_key = 'yellow_pct'              THEN config_value END), 5)  AS yellow_pct,
        ISNULL(MAX(CASE WHEN config_key = 'red_pct'                 THEN config_value END), 15) AS red_pct,
        ISNULL(MAX(CASE WHEN config_key = 'stale_minutes'           THEN config_value END), 60) AS stale_minutes,
        ISNULL(MAX(CASE WHEN config_key = 'min_pct_minutes'         THEN config_value END), 5)  AS min_pct_minutes,
        ISNULL(MAX(CASE WHEN config_key = 'min_projection_minutes'  THEN config_value END), 20) AS min_projection_minutes,
        ISNULL(MAX(CASE WHEN config_key = 'plan_time_offset_minutes'THEN config_value END), 0)  AS offset_minutes
    FROM dbo.variance_config
) cfg

-- as-of time, actual, elapsed/length in seconds, expected (full precision), raw %
CROSS APPLY (
    SELECT
        x.as_of,
        x.actual_num,
        x.elapsed_sec,
        x.len_sec,
        x.expected,
        CASE WHEN x.expected = 0 THEN NULL
             ELSE (x.actual_num - x.expected) / x.expected * 100
        END AS pct_raw
    FROM (
        SELECT
            a.as_of,
            a.actual_num,
            a.elapsed_sec,
            a.len_sec,
            CASE
                WHEN ISNULL(a.len_sec, 0) <= 0 OR a.elapsed_sec <= 0 THEN CAST(0 AS DECIMAL(28, 10))
                WHEN a.elapsed_sec >= a.len_sec THEN CAST(ISNULL(p.target, 0) AS DECIMAL(28, 10))
                ELSE CAST(ISNULL(p.target, 0) AS DECIMAL(28, 10)) * a.elapsed_sec / a.len_sec
            END AS expected
        FROM (
            SELECT
                DATEADD(MINUTE, CAST(cfg.offset_minutes AS INT), GETUTCDATE())             AS as_of,
                CAST(ISNULL(TRY_CAST(latest.value AS DECIMAL(28, 10)), 0) AS DECIMAL(28, 10)) AS actual_num,
                CAST(DATEDIFF(SECOND, p.planned_start,
                              DATEADD(MINUTE, CAST(cfg.offset_minutes AS INT), GETUTCDATE())) AS DECIMAL(28, 10)) AS elapsed_sec,
                CAST(DATEDIFF(SECOND, p.planned_start, p.planned_end) AS DECIMAL(28, 10))  AS len_sec
        ) a
    ) x
) c

CROSS APPLY (
    SELECT CASE
               WHEN ISNULL(p.is_accepted, 0) = 1
                    AND COALESCE(ctl.shift_status, 'NotStarted') = 'Running'
                    AND c.elapsed_sec >= cfg.min_projection_minutes * 60
                    AND c.elapsed_sec <  c.len_sec
               THEN c.actual_num / c.elapsed_sec * c.len_sec
           END AS projected_end
) proj

WHERE p.is_deleted = 0;
GO

/* =====================================================================
   VERIFICATION (run after the script; read-only)
   ===================================================================== */
-- A) every plan, new columns
-- SELECT plan_id, status, created_by_name, accepted_by_name, updated_by_name,
--        shift_status, target, expected, actual, variance_units, variance_pct,
--        variance_status, minutes_since_update, projected_end, projected_shortfall
-- FROM dbo.v_plan_variance ORDER BY plan_id DESC;

-- B) old columns still intact (what EF reads today)
-- SELECT plan_id, target, planned_start, planned_end, is_accepted, type, unit,
--        shift_date, shift_type, area_name, lead_emp_id, crew_id, emp_name,
--        actual_value, actuals_logged_at
-- FROM dbo.v_plan_variance;

-- C) status vs flags sanity
-- SELECT status, is_accepted, COUNT(*) FROM dbo.plan_master WHERE is_deleted = 0 GROUP BY status, is_accepted;

/* =====================================================================
   ROLLBACK (only if needed): re-create the original view from
   "reference docs/database.sql", then:
     ALTER TABLE dbo.plan_master DROP CONSTRAINT CK_plan_master_status;
     ALTER TABLE dbo.plan_master DROP CONSTRAINT DF_plan_master_status;
     ALTER TABLE dbo.plan_master DROP COLUMN [status];
     DROP TABLE dbo.variance_config;
   ===================================================================== */
