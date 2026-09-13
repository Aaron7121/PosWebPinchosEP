package com.joedev.posweb.pep.stream;

import io.smallrye.jwt.auth.principal.DefaultJWTParser;
import io.smallrye.jwt.auth.principal.JWTAuthContextInfo;
import io.smallrye.jwt.auth.principal.JWTParser;
import io.smallrye.jwt.auth.principal.ParseException;
import io.smallrye.mutiny.Multi;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.NotAuthorizedException;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import org.eclipse.microprofile.config.inject.ConfigProperty;

@Path("/api/stream")
@Produces(MediaType.SERVER_SENT_EVENTS)
public class NotificationResource {

    @Inject
    NotificationService notificationService;

    @Inject
    @ConfigProperty(name = "mp.jwt.verify.issuer")
    String issuer;

    @Inject
    @ConfigProperty(name = "mp.jwt.verify.publickey.location")
    String publicKeyLocation;

    JWTParser parser() {
        JWTAuthContextInfo contexto = new JWTAuthContextInfo();
        contexto.setIssuedBy(issuer);
        contexto.setPublicKeyLocation(publicKeyLocation);
        return new DefaultJWTParser(contexto);
    }

    @GET
    public Multi<Notificacion> stream(@QueryParam("token") String token) {
        if (token == null || token.isBlank()) {
            throw new NotAuthorizedException("Token requerido para el stream");
        }
        try {
            parser().parse(token);
        } catch (ParseException e) {
            throw new NotAuthorizedException("Token invalido");
        }
        return notificationService.suscribir();
    }
}