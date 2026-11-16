package com.kurilabo.availability.infrastructure;

import com.kurilabo.availability.domain.SalonSetting;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SalonSettingRepository extends JpaRepository<SalonSetting, Short> {
}

