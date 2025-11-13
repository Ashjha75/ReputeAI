package com.reputeai.server.reputeai;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = {"com.reputeai.server.reputeai"})
public class ReputeaiApplication {

    public static void main(String[] args) {

        SpringApplication.run(ReputeaiApplication.class, args);

        System.out.println("✨🪸🍵✨ Reputeai Server Started ✨🪸🍵✨");
    }

}
