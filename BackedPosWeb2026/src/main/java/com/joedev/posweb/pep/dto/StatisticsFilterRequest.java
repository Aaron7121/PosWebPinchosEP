package com.joedev.posweb.pep.dto;

import java.time.LocalDate;

public record StatisticsFilterRequest(
    LocalDate desde,
    LocalDate hasta,
    String tipoServicio
) {}
