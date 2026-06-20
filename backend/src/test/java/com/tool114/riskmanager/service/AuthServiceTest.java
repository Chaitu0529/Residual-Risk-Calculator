package com.tool114.riskmanager.service;

import com.tool114.riskmanager.dto.LoginRequest;
import com.tool114.riskmanager.dto.RegisterRequest;
import com.tool114.riskmanager.dto.AuthResponse;
import com.tool114.riskmanager.entity.Role;
import com.tool114.riskmanager.entity.User;
import com.tool114.riskmanager.exception.BadRequestException;
import com.tool114.riskmanager.repository.RoleRepository;
import com.tool114.riskmanager.repository.UserRepository;
import com.tool114.riskmanager.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private RoleRepository roleRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private AuthenticationManager authenticationManager;
    @Mock private JwtUtil jwtUtil;
    @Mock private UserDetailsService userDetailsService;
    @Mock private AuditLogService auditLogService;

    @InjectMocks
    private AuthService authService;

    private Role userRole;
    private User sampleUser;

    @BeforeEach
    void setUp() {
        userRole = new Role(1L, Role.ERole.ROLE_USER);
        sampleUser = User.builder()
                .id(1L)
                .username("testuser")
                .email("test@example.com")
                .password("encoded-password")
                .fullName("Test User")
                .roles(Set.of(userRole))
                .isActive(true)
                .build();
    }

    @Test
    void register_throwsBadRequest_whenUsernameAlreadyExists() {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("existinguser");
        request.setEmail("new@example.com");
        request.setPassword("Password@123");

        when(userRepository.existsByUsername("existinguser")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request, null))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("Username is already taken");
    }

    @Test
    void register_throwsBadRequest_whenEmailAlreadyExists() {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("newuser");
        request.setEmail("existing@example.com");
        request.setPassword("Password@123");

        when(userRepository.existsByUsername("newuser")).thenReturn(false);
        when(userRepository.existsByEmail("existing@example.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request, null))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("Email is already registered");
    }

    @Test
    void login_throwsBadCredentials_withWrongPassword() {
        LoginRequest request = new LoginRequest();
        request.setUsername("testuser");
        request.setPassword("wrongpass");

        when(authenticationManager.authenticate(any()))
            .thenThrow(new BadCredentialsException("Bad credentials"));
        doNothing().when(auditLogService).logFailure(any(), any(), any(), any(), any());

        assertThatThrownBy(() -> authService.login(request, null))
            .isInstanceOf(BadCredentialsException.class);
    }

    @Test
    void login_succeeds_withValidCredentials() {
        LoginRequest request = new LoginRequest();
        request.setUsername("testuser");
        request.setPassword("Password@123");

        UserDetails userDetails = org.springframework.security.core.userdetails.User.builder()
                .username("testuser").password("encoded").roles("USER").build();

        Authentication auth = mock(Authentication.class);
        when(auth.getPrincipal()).thenReturn(userDetails);
        when(authenticationManager.authenticate(any())).thenReturn(auth);
        when(jwtUtil.generateToken(any())).thenReturn("access-token");
        when(jwtUtil.generateRefreshToken(any())).thenReturn("refresh-token");
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(sampleUser));
        doNothing().when(userRepository).updateLastLogin(any(), any());
        doNothing().when(auditLogService).log(any(), any(), any(), any(), any(), any());

        AuthResponse response = authService.login(request, null);

        assertThat(response.getToken()).isEqualTo("access-token");
        assertThat(response.getUsername()).isEqualTo("testuser");
    }
}
