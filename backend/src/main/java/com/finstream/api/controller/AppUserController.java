package com.finstream.api.controller;

import com.finstream.api.dto.AppUserDto;
import com.finstream.api.service.AppUserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AppUserController {
    private final AppUserService appUserService;

    @GetMapping("/me")
    public ResponseEntity<AppUserDto> getCurrentUser(
            @RequestHeader("X-Firebase-UID") String firebaseUid) {
        AppUserDto user = appUserService.getCurrentUser(firebaseUid);
        return ResponseEntity.ok(user);
    }

    @PutMapping("/me")
    public ResponseEntity<AppUserDto> updateCurrentUser(
            @RequestHeader("X-Firebase-UID") String firebaseUid,
            @Valid @RequestBody AppUserDto dto) {
        AppUserDto updatedUser = appUserService.upsertUser(firebaseUid, dto);
        return ResponseEntity.ok(updatedUser);
    }
}
