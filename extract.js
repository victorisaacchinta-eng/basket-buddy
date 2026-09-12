return JSON.stringify(await page.evaluate(() => {
  const btns = Array.from(document.querySelectorAll('button, div')).filter(
    el => el.textContent.trim() === 'ADD' && el.children.length === 0
  );
  return btns.slice(0, 6).map(b => {
    const card = b.closest('a') || b.parentElement.parentElement.parentElement;
    if (!card) return null;
    return card.innerText.split('\n').filter(Boolean).join(' | ').slice(0, 150);
  });
}));
