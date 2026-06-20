package com.tool114.riskmanager;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableCaching
@EnableScheduling
@EnableJpaAuditing
public class RiskManagerApplication {

    public static void main(String[] args) {
        SpringApplication.run(RiskManagerApplication.class, args);
    }
}
