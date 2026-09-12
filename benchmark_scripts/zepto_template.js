await page.goto('https://www.zepto.com/search?query=__QUERY__', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2000);
return JSON.stringify(await page.evaluate(() => {
  const btns = Array.from(document.querySelectorAll('button, div')).filter(
    el => el.textContent.trim() === 'ADD' && el.children.length === 0
  );
  const noise = /^(OFF|ADD|Ad)$/i;
  return btns.slice(0, 5).map(b => {
    const card = b.closest('a') || b.parentElement.parentElement.parentElement;
    if (!card) return null;
    const text = card.innerText;
    const lines = text.split('\n').map(s => s.trim()).filter(Boolean);
    const prices = (text.match(/₹\d+/g) || []).map(p => p.replace('₹', ''));
    const sizeMatch = text.match(/\d+\s?(ml|g|kg|l|pack)/i);
    const name = lines.find(l =>
      !/^₹/.test(l) && !noise.test(l) && !/^\d/.test(l) &&
      !(sizeMatch && l.includes(sizeMatch[0])) && l.length > 3
    );
    return { name: name || null, size: sizeMatch ? sizeMatch[0] : null, price: prices[0] || null, mrp: prices[1] || null };
  }).filter(Boolean);
}));
