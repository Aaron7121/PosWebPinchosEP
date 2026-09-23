package com.joedev.posweb.pep.auth;

public record AuthResponse(String token, UserResponse user) {
}