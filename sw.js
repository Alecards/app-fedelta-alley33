<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Alley33 Card</title>
    
    <!-- Meta tag per PWA -->
    <meta name="theme-color" content="#ffffff">
    <link rel="apple-touch-icon" href="icon-192x192.png">
    <link rel="manifest" href="manifest.json">

    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
        .hidden { display: none; }
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.6); display: flex; align-items: center; justify-content: center; z-index: 50; }
        .loader { border: 4px solid #f3f3f3; border-radius: 50%; border-top: 4px solid #4f46e5; width: 40px; height: 40px; animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        #welcome-view {
            background-image: linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url('https://www.alley33.it/cdn/shop/files/alley-33-negozio-di-abbigliamento-a-rovigo.jpg?v=1683192017&width=1500');
            background-size: cover;
            background-position: center;
        }
    </style>
</head>
<body class="bg-gray-100">

    <div id="app-container" class="max-w-md mx-auto bg-white shadow-lg min-h-screen relative">

        <div id="loading-view" class="flex items-center justify-center min-h-screen"><div class="loader"></div></div>

        <div id="welcome-view" class="flex flex-col justify-between h-screen p-8 text-white hidden">
            <div class="text-center">
                <!-- LOGO BIANCO LOCALE -->
                <img src="./Logo_Alley_bianco.png" alt="Logo Alley33" class="w-48 mx-auto" onerror="this.style.display='none'">
            </div>
            <div class="text-center"><h1 class="text-4xl font-extrabold">Benvenuto</h1><p class="mt-2">La tua fidelity card, sempre con te.</p></div>
            <div class="space-y-4">
                <!-- PULSANTE INSTALLA PWA -->
                <button id="install-pwa-button" class="w-full bg-gr
