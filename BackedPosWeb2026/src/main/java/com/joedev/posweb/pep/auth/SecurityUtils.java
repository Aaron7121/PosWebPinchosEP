package com.joedev.posweb.pep.auth;

import org.mindrot.jbcrypt.BCrypt;

public final class SecurityUtils {

    private SecurityUtils() {
    }

    public static String hash(String contrasena) {
        return BCrypt.hashpw(contrasena, BCrypt.gensalt(10));
    }

    public static boolean verificar(String contrasena, String hash) {
        return BCrypt.checkpw(contrasena, hash);
    }
}