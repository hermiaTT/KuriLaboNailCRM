package com.kurilabo.shared.phone;

public final class PhoneNumberNormalizer {

    private PhoneNumberNormalizer() {
    }

    public static String normalize(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Phone number is required.");
        }
        String digits = value.replaceAll("\\D", "");
        if (digits.length() == 10) {
            return "+1" + digits;
        }
        if (digits.length() >= 11 && digits.length() <= 15) {
            return "+" + digits;
        }
        throw new IllegalArgumentException("Enter a valid phone number, including area code.");
    }
}
