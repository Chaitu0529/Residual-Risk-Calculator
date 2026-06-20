package com.tool114.riskmanager.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeIn;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.info.License;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.annotations.servers.Server;
import org.springframework.context.annotation.Configuration;

@OpenAPIDefinition(
    info = @Info(
        title = "Tool-114 Residual Risk Calculator API",
        version = "1.0.0",
        description = """
            Enterprise AI-Powered Residual Risk Calculator REST API.
            
            **Authentication:** Use the /auth/login endpoint to obtain a JWT Bearer token,
            then click 'Authorize' and enter: Bearer {your-token}
            
            **Risk Calculation Formula:**
            - Inherent Risk = Likelihood × Impact
            - Residual Risk = Inherent Risk × (100 - Control Effectiveness) / 100
            
            **Risk Levels:** LOW (0-20) | MEDIUM (21-50) | HIGH (51-80) | CRITICAL (81-100)
            """,
        contact = @Contact(name = "Tool-114 Team", email = "admin@tool114.com"),
        license = @License(name = "Proprietary")
    ),
    servers = {
        @Server(url = "http://localhost:8080", description = "Local Development"),
        @Server(url = "http://backend:8080", description = "Docker Container")
    }
)
@SecurityScheme(
    name = "bearerAuth",
    type = SecuritySchemeType.HTTP,
    scheme = "bearer",
    bearerFormat = "JWT",
    in = SecuritySchemeIn.HEADER,
    description = "JWT Authorization header using the Bearer scheme. Enter: Bearer {token}"
)
@Configuration
public class OpenApiConfig {
}
