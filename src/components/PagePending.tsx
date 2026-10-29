/** Server fallback of private pages (ssr: false): shown until the browser renders the page. */
export function PagePending() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center space-y-3 px-4">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"/>
                <p className="font-semibold text-foreground">SovetPay — аренда жилья через рекомендации</p>
                <p className="text-muted-foreground">Загружаем страницу, это займёт пару секунд...</p>
                <a href="/" className="text-sm text-primary underline">Вернуться на главную страницу SovetPay</a>
            </div>
        </div>
    );
}
