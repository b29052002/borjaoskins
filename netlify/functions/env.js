(function() {
    const d = atob('aHR0cHM6Ly95eW95eGFubG9sb3Vwd29jemtoci5zdXBhYmFzZS5jb3xleUpoYkdjaU9pSklVekkxTmlJc0luUjVjQ0k2SWtwWFZDSjkuZXlKcGMzTWlPaUp6ZFhCaFltRnpaU0lzSW5KbFppSTZJbmw1YjNsNFlXNXNiMnh2ZFhCM2IyTjZhMmh5SWl3aWNtOXNaU0k2SW1GdWIyNGlMQ0pwWVhRaU9qRTNOamsyT0RNMk1qWXNJbVY0Y0NJNk1qQTROVEkxT1RZeU5uMC55VjlVc3p4WlcwRWU1WDZaajhPTG8xUV91UWZqOTlSSnZpYVpJSW1pTUFNfDY5NmVhNjJjNjkyZmIzYTM2ZjIzMDczMWY5N2MxNGJhNDAzNjhiMmJjYmU4ZWViMDJlNWRhYjdkNDFkYTk5ODR8QVBQX1VTUi00ZWQ2NjY0MC01MTFlLTRhZWEtODQ2Yi03MDQ5OWJlMTExNTY=').split('|');
    window.ENV = {
        get SUPABASE_URL() {
            return d[0]
        },
        get SUPABASE_KEY() {
            return d[1]
        },
        get ADMIN_HASH() {
            return d[2]
        },
        get MP_PUBLIC_KEY() {
            return d[3]
        }
    };
})();
