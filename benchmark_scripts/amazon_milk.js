await page.goto('https://www.amazon.in/s?k=milk', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2000);
return JSON.stringify(await page.evaluate(() => {
  const cards = Array.from(document.querySelectorAll('[data-component-type="s-search-result"]')).slice(0, 5);
  return cards.map(c => {
    const name = c.querySelector('h2 span')?.textContent?.trim() || null;
    const price = c.querySelector('.a-price .a-offscreen')?.textContent?.trim() || null;
    return { name, price };
  }).filter(p => p.name);
}));
