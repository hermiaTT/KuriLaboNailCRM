package com.kurilabo.shared.config;

import com.kurilabo.auth.config.AuthProperties;
import com.nimbusds.jose.jwk.source.ImmutableSecret;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.authentication.AbstractAuthenticationToken;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;

@Configuration
@EnableConfigurationProperties(AuthProperties.class)
public class SecurityConfig {

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers("/actuator/health/**").permitAll()
                        .requestMatchers(
                                "/", "/index.html", "/assets/**", "/favicon.ico",
                                "/login", "/register", "/client/**",
                                "/appointments", "/clients", "/schedule",
                                "/inspiration", "/services", "/notifications"
                        ).permitAll()
                        .requestMatchers("/api/v1/services").permitAll()
                        .requestMatchers("/api/v1/auth/**").permitAll()
                        .requestMatchers("/api/v1/media/**").permitAll()
                        .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                        .anyRequest().authenticated())
                .oauth2ResourceServer(oauth -> oauth.jwt(jwt ->
                        jwt.jwtAuthenticationConverter(jwtAuthenticationConverter())))
                .build();
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    SecretKey jwtSecretKey(AuthProperties properties) {
        byte[] secret = properties.tokenSecret().getBytes(StandardCharsets.UTF_8);
        if (secret.length < 32) {
            throw new IllegalStateException("AUTH_TOKEN_SECRET must contain at least 32 bytes.");
        }
        return new SecretKeySpec(secret, "HmacSHA256");
    }

    @Bean
    JwtEncoder jwtEncoder(SecretKey secretKey) {
        return new NimbusJwtEncoder(new ImmutableSecret<>(secretKey));
    }

    @Bean
    JwtDecoder jwtDecoder(SecretKey secretKey) {
        return NimbusJwtDecoder.withSecretKey(secretKey)
                .macAlgorithm(MacAlgorithm.HS256)
                .build();
    }

    private Converter<Jwt, AbstractAuthenticationToken> jwtAuthenticationConverter() {
        return jwt -> {
            String role = jwt.getClaimAsString("role");
            return new JwtAuthenticationToken(
                    jwt,
                    java.util.List.of(new SimpleGrantedAuthority("ROLE_" + role)),
                    jwt.getSubject()
            );
        };
    }
}

