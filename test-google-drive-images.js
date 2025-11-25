// Google Drive rasmlarni test qilish uchun
// Bu faylni browser console'da ishlatish mumkin

// Test 1: Google Drive linkni to'g'ri formatga o'zgartirish
function convertGoogleDriveLink(url) {
    if (!url) return '';

    url = url.trim();

    if (url.includes('drive.google.com')) {
        // Format 1: /file/d/FILE_ID/view
        let match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
        if (match && match[1]) {
            return `https://drive.google.com/uc?export=view&id=${match[1]}`;
        }

        // Format 2: /open?id=FILE_ID
        match = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
        if (match && match[1]) {
            return `https://drive.google.com/uc?export=view&id=${match[1]}`;
        }

        // Format 3: Already in uc format
        if (url.includes('/uc?')) {
            return url;
        }
    }

    return url;
}

// Test linklar
const testLinks = [
    'https://drive.google.com/file/d/1ABC123xyz/view?usp=sharing',
    'https://drive.google.com/open?id=1ABC123xyz',
    'https://drive.google.com/uc?export=view&id=1ABC123xyz',
    'https://i.imgur.com/abc123.png'
];

console.log('=== Google Drive Link Converter Test ===');
testLinks.forEach(link => {
    console.log(`Original: ${link}`);
    console.log(`Converted: ${convertGoogleDriveLink(link)}`);
    console.log('---');
});

// Test 2: Rasmni yuklashni tekshirish
function testImageLoad(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve({ success: true, url });
        img.onerror = () => reject({ success: false, url, error: 'Failed to load' });
        img.src = url;

        // 10 soniya timeout
        setTimeout(() => reject({ success: false, url, error: 'Timeout' }), 10000);
    });
}

// Foydalanish:
// testImageLoad('YOUR_IMAGE_URL_HERE').then(console.log).catch(console.error);

console.log('\n=== Rasmni tekshirish uchun ===');
console.log('testImageLoad("RASM_URL_NI_BU_YERGA").then(console.log).catch(console.error)');
