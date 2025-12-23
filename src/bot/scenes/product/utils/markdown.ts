function escapeMarkdownV2(text: string): string {
	return text.replace(/[_*[\]()~`>#+-=|{}.!]/g, '\\$&');
}

export const buildProductMessage = (product: any, category: any): string => {
	const escape = escapeMarkdownV2;

	return (
		`🔹 **Nomi:** ${escape(product.name)}\n` +
		`💰 **Narxi:** ${escape(product.price.toString())} so'm\n` +
		`📝 **Tavsifi:** ${escape(product.description || "null")}\n` +
		`📂 **Kategoriyasi:** ${escape(category.name)}\n` +
		`🖼️ **Kategoriya rasmi:** ${escape(category.categoryImg || "null")}`
	);
}
