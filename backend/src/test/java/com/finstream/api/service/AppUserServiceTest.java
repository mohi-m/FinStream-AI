package com.finstream.api.service;

import com.finstream.api.dto.AppUserDto;
import com.finstream.api.entity.AppUser;
import com.finstream.api.exception.DuplicateResourceException;
import com.finstream.api.exception.ResourceNotFoundException;
import com.finstream.api.repository.AppUserRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AppUserServiceTest {

    @Mock
    private AppUserRepository appUserRepository;

    @InjectMocks
    private AppUserService appUserService;

    private AppUser mockUser;
    private AppUserDto mockDto;
    private final String FIREBASE_UID = "firebase-123";

    @BeforeEach
    void setUp() {
        mockUser = new AppUser();
        mockUser.setFirebaseUid(FIREBASE_UID);
        mockUser.setEmail("test@example.com");
        mockUser.setFullName("Test User");
        mockUser.setCreatedAt(LocalDateTime.now());
        mockUser.setUpdatedAt(LocalDateTime.now());

        mockDto = new AppUserDto();
        mockDto.setEmail("test@example.com");
        mockDto.setFullName("Test User");
    }

    @Test
    void getCurrentUser_UserExists_ReturnsUserDto() {
        when(appUserRepository.findById(FIREBASE_UID)).thenReturn(Optional.of(mockUser));

        AppUserDto result = appUserService.getCurrentUser(FIREBASE_UID);

        assertNotNull(result);
        assertEquals(FIREBASE_UID, result.getFirebaseUid());
        assertEquals("test@example.com", result.getEmail());
        assertEquals("Test User", result.getFullName());
        verify(appUserRepository, times(1)).findById(FIREBASE_UID);
    }

    @Test
    void getCurrentUser_UserNotFound_ThrowsResourceNotFoundException() {
        when(appUserRepository.findById(FIREBASE_UID)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> appUserService.getCurrentUser(FIREBASE_UID));
        verify(appUserRepository, times(1)).findById(FIREBASE_UID);
    }

    @Test
    void upsertUser_NewUser_CreatesAndReturnsUserDto() {
        when(appUserRepository.findById(FIREBASE_UID)).thenReturn(Optional.empty());
        when(appUserRepository.findByEmail(anyString())).thenReturn(Optional.empty());
        when(appUserRepository.save(any(AppUser.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AppUserDto result = appUserService.upsertUser(FIREBASE_UID, mockDto);

        assertNotNull(result);
        assertEquals(FIREBASE_UID, result.getFirebaseUid());
        assertEquals("test@example.com", result.getEmail());
        assertEquals("Test User", result.getFullName());
        verify(appUserRepository, times(1)).findById(FIREBASE_UID);
        verify(appUserRepository, times(1)).findByEmail(anyString());
        verify(appUserRepository, times(1)).save(any(AppUser.class));
    }

    @Test
    void upsertUser_ExistingUserSameEmail_UpdatesAndReturnsUserDto() {
        when(appUserRepository.findById(FIREBASE_UID)).thenReturn(Optional.of(mockUser));
        when(appUserRepository.save(any(AppUser.class))).thenAnswer(invocation -> invocation.getArgument(0));

        mockDto.setFullName("Updated Name");
        AppUserDto result = appUserService.upsertUser(FIREBASE_UID, mockDto);

        assertNotNull(result);
        assertEquals(FIREBASE_UID, result.getFirebaseUid());
        assertEquals("test@example.com", result.getEmail());
        assertEquals("Updated Name", result.getFullName());
        verify(appUserRepository, times(1)).findById(FIREBASE_UID);
        verify(appUserRepository, never()).findByEmail(anyString());
        verify(appUserRepository, times(1)).save(any(AppUser.class));
    }

    @Test
    void upsertUser_ExistingUserNewEmailAvailable_UpdatesAndReturnsUserDto() {
        when(appUserRepository.findById(FIREBASE_UID)).thenReturn(Optional.of(mockUser));
        when(appUserRepository.findByEmail("new@example.com")).thenReturn(Optional.empty());
        when(appUserRepository.save(any(AppUser.class))).thenAnswer(invocation -> invocation.getArgument(0));

        mockDto.setEmail("new@example.com");
        AppUserDto result = appUserService.upsertUser(FIREBASE_UID, mockDto);

        assertNotNull(result);
        assertEquals(FIREBASE_UID, result.getFirebaseUid());
        assertEquals("new@example.com", result.getEmail());
        verify(appUserRepository, times(1)).findById(FIREBASE_UID);
        verify(appUserRepository, times(1)).findByEmail("new@example.com");
        verify(appUserRepository, times(1)).save(any(AppUser.class));
    }

    @Test
    void upsertUser_ExistingUserNewEmailTakenByOther_ThrowsDuplicateResourceException() {
        AppUser otherUser = new AppUser();
        otherUser.setFirebaseUid("other-123");
        otherUser.setEmail("new@example.com");

        when(appUserRepository.findById(FIREBASE_UID)).thenReturn(Optional.of(mockUser));
        when(appUserRepository.findByEmail("new@example.com")).thenReturn(Optional.of(otherUser));

        mockDto.setEmail("new@example.com");

        assertThrows(DuplicateResourceException.class, () -> appUserService.upsertUser(FIREBASE_UID, mockDto));
        verify(appUserRepository, times(1)).findById(FIREBASE_UID);
        verify(appUserRepository, times(1)).findByEmail("new@example.com");
        verify(appUserRepository, never()).save(any(AppUser.class));
    }
}

