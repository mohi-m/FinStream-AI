package com.finstream.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AppUserDto {
    private String firebaseUid;

    @Email(message = "Email should be valid")
    private String email;

    @NotBlank(message = "Full name cannot be blank", groups = {Create.class, Update.class})
    private String fullName;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public interface Create {}
    public interface Update {}
}
