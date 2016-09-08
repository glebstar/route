<?php

if (file_exists(__DIR__ . '/config.local.php')) {
    require_once __DIR__ . '/config.local.php';
} else {
    $url = 'http://example.com/api/v1';
}
