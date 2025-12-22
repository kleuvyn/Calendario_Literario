module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[project]/app/api/reading-data/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

// Dentro do seu arquivo route.ts, na parte do POST:
if (action === "START_READING") {
    let autoCover = "";
    let autoPages = 0;
    try {
        // Busca os dados no Google Books
        const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(bookName)}`);
        const bookData = await response.json();
        if (bookData.items && bookData.items.length > 0) {
            const info = bookData.items[0].volumeInfo;
            autoCover = info.imageLinks?.thumbnail?.replace("http:", "https:") || "";
            autoPages = info.pageCount || 0;
        }
    } catch (e) {
        console.error("Erro ao buscar dados do livro automaticamente");
    }
    await executeQuery(`
    INSERT INTO public.reading_data (email, user_id, book_name, start_date, year, month, status, total_pages)
    VALUES ($1, $2, $3, $4, $5, $6, 'lendo', $7)
  `, [
        email,
        userId,
        bookName,
        startDate,
        year,
        month,
        autoPages
    ]);
    // Se achou uma capa, já cria o review para a capa aparecer no calendário
    if (autoCover) {
        await executeQuery(`
      INSERT INTO public.book_reviews (user_id, title, cover_url, total_pages, year, month)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (user_id, title) DO NOTHING
    `, [
            userId,
            bookName,
            autoCover,
            autoPages,
            year,
            month
        ]);
    }
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, true);}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__64dfcebd._.js.map