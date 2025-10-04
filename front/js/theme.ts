export function toggleTheme() {
	const body = document.body;
	const checkbox = document.getElementById('theme-checkbox') as HTMLInputElement;

	body.classList.toggle('dark');

	const isDark = body.classList.contains('dark');
	localStorage.setItem('theme', isDark ? 'dark' : 'light');

	if (checkbox) {
		checkbox.checked = isDark;
	}
}

export function loadTheme() {
	const savedTheme = localStorage.getItem('theme');
	const checkbox = document.getElementById('theme-checkbox') as HTMLInputElement;

	if (savedTheme === 'dark') {
		document.body.classList.add('dark');
		if (checkbox) {
			checkbox.checked = true;
		}
	} else {
		document.body.classList.remove('dark');
		if (checkbox) {
			checkbox.checked = false;
		}
	}
}

