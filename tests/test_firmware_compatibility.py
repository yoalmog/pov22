#!/usr/bin/env python3
import unittest

# ==========================================
# Core Firmware Compatibility & Version Logic
# ==========================================

def validate_firmware_header(header_bytes):
    """
    ESP32 Header Check.
    Magic byte 0xE9 at offset 0.
    """
    if not header_bytes or len(header_bytes) < 32:
        raise ValueError("Invalid firmware binary: Header too short.")
    if header_bytes[0] != 0xE9:
        raise ValueError("Invalid firmware binary: Magic byte mismatch (expected 0xE9).")
    return True

def get_firmware_model(chip_id):
    """
    Resolves chip ID from header offset 2 to model name.
    """
    models = {
        0: "ESP32",
        2: "ESP32-S2",
        5: "ESP32-C3",
        9: "ESP32-S3",
        12: "ESP32-C2",
        13: "ESP32-H2"
    }
    return models.get(chip_id, "Unknown")

def check_model_compatibility(chip_model, firmware_model):
    """
    Validates model compatibility.
    Returns True if compatible, False if there is a mismatch.
    """
    if not chip_model or firmware_model == "Unknown":
        return True # Fallback or can't determine, avoid hard blocking unless mismatch is certain
        
    current_is_s3 = "S3" in chip_model
    current_is_c3 = "C3" in chip_model
    current_is_plain = not current_is_s3 and not current_is_c3 and "ESP32" in chip_model

    target_is_s3 = firmware_model == "ESP32-S3"
    target_is_c3 = firmware_model == "ESP32-C3"
    target_is_plain = firmware_model == "ESP32"

    # Mismatch checking
    if (current_is_s3 and not target_is_s3) or \
       (current_is_c3 and not target_is_c3) or \
       (current_is_plain and not target_is_plain):
        return False
        
    return True

def parse_version(version_str):
    """
    Parses a version string like '1.2.0' or '1.0.0 (Fallback)' or '1.2.0-beta' into a tuple of integers.
    Gracefully handles malformed strings.
    """
    if not version_str or not isinstance(version_str, str):
        return (0, 0, 0)
    
    # Strip any extra description like '(Fallback)' or release tags like '-beta'
    clean_ver = version_str.split()[0].split('-')[0]
    parts = clean_ver.split('.')
    
    parsed_parts = []
    for part in parts[:3]:
        # Extract leading numeric part
        numeric_part = ""
        for char in part:
            if char.isdigit():
                numeric_part += char
            else:
                break
        if numeric_part:
            parsed_parts.append(int(numeric_part))
        else:
            parsed_parts.append(0)
            
    # Pad with zeros if less than 3 parts
    while len(parsed_parts) < 3:
        parsed_parts.append(0)
        
    return tuple(parsed_parts[:3])

def compare_firmware_versions(server_version, device_version):
    """
    Compares server version vs device version.
    Returns:
    - 'update_available' if server_version > device_version
    - 'up_to_date' if server_version <= device_version
    - 'error' if version checks fail or are unknown
    """
    if not server_version or not device_version:
        return 'error'
        
    if device_version == 'unknown' or server_version == 'unknown':
        return 'update_available' # Safe default to prompt update if one is unknown
        
    try:
        srv_parsed = parse_version(server_version)
        dev_parsed = parse_version(device_version)
        
        if srv_parsed > dev_parsed:
            return 'update_available'
        else:
            return 'up_to_date'
    except Exception:
        return 'error'


# ==========================================
# Unit Tests for Firmware Compatibility
# ==========================================

class TestFirmwareCompatibility(unittest.TestCase):
    
    def test_validate_firmware_header_valid(self):
        """Test with a valid firmware header (Magic byte 0xE9 at offset 0, length >= 32)"""
        valid_header = bytearray(32)
        valid_header[0] = 0xE9
        self.assertTrue(validate_firmware_header(valid_header))
        
    def test_validate_firmware_header_invalid_magic(self):
        """Test with an invalid magic byte"""
        invalid_header = bytearray(32)
        invalid_header[0] = 0xAA # Incorrect magic
        with self.assertRaises(ValueError):
            validate_firmware_header(invalid_header)
            
    def test_validate_firmware_header_too_short(self):
        """Test with a header that is too short"""
        short_header = bytearray([0xE9, 0x01, 0x02])
        with self.assertRaises(ValueError):
            validate_firmware_header(short_header)
            
    def test_get_firmware_model(self):
        """Test resolving Chip IDs to ESP32 model families"""
        self.assertEqual(get_firmware_model(0), "ESP32")
        self.assertEqual(get_firmware_model(2), "ESP32-S2")
        self.assertEqual(get_firmware_model(5), "ESP32-C3")
        self.assertEqual(get_firmware_model(9), "ESP32-S3")
        self.assertEqual(get_firmware_model(12), "ESP32-C2")
        self.assertEqual(get_firmware_model(13), "ESP32-H2")
        self.assertEqual(get_firmware_model(99), "Unknown") # Unmapped chip ID
        
    def test_check_model_compatibility_matching(self):
        """Test compatible model combinations"""
        self.assertTrue(check_model_compatibility("ESP32-S3-WROOM-1", "ESP32-S3"))
        self.assertTrue(check_model_compatibility("ESP32-C3-MINI", "ESP32-C3"))
        self.assertTrue(check_model_compatibility("ESP32-D0WD", "ESP32"))
        
    def test_check_model_compatibility_mismatch(self):
        """Test incompatible model combinations"""
        self.assertFalse(check_model_compatibility("ESP32-S3-WROOM-1", "ESP32-C3"))
        self.assertFalse(check_model_compatibility("ESP32-C3-MINI", "ESP32"))
        self.assertFalse(check_model_compatibility("ESP32-D0WD", "ESP32-S3"))
        
    def test_check_model_compatibility_edge_cases(self):
        """Test fallback edge cases where compatibility cannot be determined confidently"""
        self.assertTrue(check_model_compatibility("", "ESP32")) # Missing connected model
        self.assertTrue(check_model_compatibility("ESP32-S3", "Unknown")) # Unknown firmware target
        
    def test_parse_version_valid(self):
        """Test parsing standard valid version strings"""
        self.assertEqual(parse_version("1.2.0"), (1, 2, 0))
        self.assertEqual(parse_version("10.3.5"), (10, 3, 5))
        
    def test_parse_version_malformed(self):
        """Test parsing malformed version strings gracefully"""
        self.assertEqual(parse_version("1.2.0 (Fallback)"), (1, 2, 0))
        self.assertEqual(parse_version("1.3"), (1, 3, 0))
        self.assertEqual(parse_version("2"), (2, 0, 0))
        self.assertEqual(parse_version("invalid-version"), (0, 0, 0))
        self.assertEqual(parse_version(None), (0, 0, 0))
        self.assertEqual(parse_version(123), (0, 0, 0)) # Not a string
        
    def test_compare_firmware_versions_update_available(self):
        """Test when an update is available (server version > device version)"""
        self.assertEqual(compare_firmware_versions("1.2.0", "1.0.0"), "update_available")
        self.assertEqual(compare_firmware_versions("1.10.0", "1.2.0"), "update_available")
        self.assertEqual(compare_firmware_versions("2.0.0", "1.9.9"), "update_available")
        self.assertEqual(compare_firmware_versions("1.2.0", "unknown"), "update_available")
        
    def test_compare_firmware_versions_up_to_date(self):
        """Test when device is up to date (server version <= device version)"""
        self.assertEqual(compare_firmware_versions("1.2.0", "1.2.0"), "up_to_date")
        self.assertEqual(compare_firmware_versions("1.0.0", "1.2.0"), "up_to_date")
        self.assertEqual(compare_firmware_versions("1.1.0", "1.1.0 (Fallback)"), "up_to_date")
        
    def test_compare_firmware_versions_error(self):
        """Test handling of extreme error edge cases during comparison"""
        self.assertEqual(compare_firmware_versions(None, "1.0.0"), "error")
        self.assertEqual(compare_firmware_versions("1.2.0", None), "error")


if __name__ == "__main__":
    unittest.main()
