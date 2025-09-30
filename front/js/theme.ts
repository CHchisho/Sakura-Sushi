export function toggleTheme() {
  const body = document.body;
  const checkbox = document.getElementById('theme-checkbox') as HTMLInputElement;

  body.classList.toggle('dark');

  const isDark = body.classList.contains('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');

  checkbox.checked = isDark;
}

export function loadTheme() {
  const savedTheme = localStorage.getItem('theme');
  const checkbox = document.getElementById('theme-checkbox') as HTMLInputElement;

  if (savedTheme === 'dark') {
    document.body.classList.add('dark');
    checkbox.checked = true;
  } else {
    document.body.classList.remove('dark');
    checkbox.checked = false;
  }
}

