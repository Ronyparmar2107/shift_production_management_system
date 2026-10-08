using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using SPMS.Server.Data;
using SPMS.Server.Services;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// ---- Configuration check -------------------------------------------------
// Fail at startup (with a clear message) instead of at the first request when a
// secret is missing. Real values come from `dotnet user-secrets` in development
// and from environment variables on the server (Jwt__Key, ConnectionStrings__DefaultConnection, ...).
const string SecretPlaceholder = "SET-VIA-USER-SECRETS";

var jwtKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrWhiteSpace(jwtKey) || jwtKey == SecretPlaceholder || Encoding.UTF8.GetByteCount(jwtKey) < 32)
    throw new InvalidOperationException("Jwt:Key is missing or too short (min 32 characters). Set it with user-secrets (dev) or the Jwt__Key environment variable (prod).");

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
if (string.IsNullOrWhiteSpace(connectionString) || connectionString == SecretPlaceholder)
    throw new InvalidOperationException("ConnectionStrings:DefaultConnection is not set. Use user-secrets (dev) or the ConnectionStrings__DefaultConnection environment variable (prod).");

// Allowed frontend origins come from config (Cors:AllowedOrigins), one set per environment
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();
if (allowedOrigins.Length == 0 || allowedOrigins.Any(o => o.Contains("CHANGE-ME", StringComparison.OrdinalIgnoreCase)))
    throw new InvalidOperationException("Cors:AllowedOrigins is not configured for this environment. Set the frontend URL in appsettings.{Environment}.json or the Cors__AllowedOrigins__0 environment variable.");

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddDbContext<AppDbContext>(options => options.UseSqlServer(connectionString));


builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidateLifetime = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    }
    );

builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
    });
    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontendApp", policy =>
    {
        policy.WithOrigins(allowedOrigins)
        .AllowAnyHeader()
        .AllowAnyMethod();
    });
});



builder.Services.AddAuthorization();

builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<CurrentUserService>();

builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IEmployeeService, EmployeeService>();
builder.Services.AddScoped<IPlanService, PlanService>();
builder.Services.AddScoped<IShiftService, ShiftService>();
builder.Services.AddScoped<IAreaService, AreaService>();    
builder.Services.AddScoped<IRoleService, RoleService>();
builder.Services.AddScoped<ICrewService, CrewService>();
builder.Services.AddScoped<IPlanTypeService, PlanTypeService>();

var app = builder.Build();

app.UseRouting();

app.UseDefaultFiles();
app.UseStaticFiles();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("AllowFrontendApp");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.MapFallbackToFile("/index.html");

app.Run();
