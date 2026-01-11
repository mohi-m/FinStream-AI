package com.finstream.api.service;

import com.finstream.api.dto.AppUserDto;
import com.finstream.api.entity.AppUser;
import com.finstream.api.exception.DuplicateResourceException;
import com.finstream.api.exception.ResourceNotFoundException;
import com.finstream.api.repository.AppUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class AppUserService {
    private final AppUserRepository appUserRepository;

    public AppUserDto getCurrentUser(String firebaseUid) {
        AppUser user = appUserRepository.findById(firebaseUid)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return mapToDto(user);
    }

    public AppUserDto upsertUser(String firebaseUid, AppUserDto dto) {
        AppUser user = appUserRepository.findById(firebaseUid)
                .orElseGet(() -> new AppUser());

        // Check for duplicate email (if email is provided and changed)
        if (dto.getEmail() != null && !dto.getEmail().equals(user.getEmail())) {
            appUserRepository.findByEmail(dto.getEmail())
                    .ifPresent(existingUser -> {
                        if (!existingUser.getFirebaseUid().equals(firebaseUid)) {
                            throw new DuplicateResourceException("Email already in use");
                        }
                    });
        }

        user.setFirebaseUid(firebaseUid);
        if (dto.getEmail() != null) {
            user.setEmail(dto.getEmail());
        }
        if (dto.getFullName() != null) {
            user.setFullName(dto.getFullName());
        }

        AppUser saved = appUserRepository.save(user);
        return mapToDto(saved);
    }

    private AppUserDto mapToDto(AppUser entity) {
        AppUserDto dto = new AppUserDto();
        dto.setFirebaseUid(entity.getFirebaseUid());
        dto.setEmail(entity.getEmail());
        dto.setFullName(entity.getFullName());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        return dto;
    }
}
