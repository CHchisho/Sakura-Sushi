let selectedType = 'All';
let currentMenu = [];

export const setMenu = (menu) => {
  currentMenu = menu;
};

export const setSelectedType = (type) => {
  selectedType = type;
  const menu_type = document.getElementById('menu_type');
  if (menu_type) {
    menu_type.textContent = type;
  }
  generateMenu(currentMenu, selectedType);
};


export const initializeFilterButtons = () => {
  const menu_filters_buttons = document.querySelectorAll('.menu_filters_button');
  menu_filters_buttons.forEach(button => {
    button.addEventListener('click', () => {
      setSelectedType(button.value);
    });
  });
};


export const generateMenuItem = (item) => {
  let html = `
    <div class="menu_item">
        <div class="top">
            <div class="top_info">
                <h4>${item.title}</h4>
                <p>${item.description}</p>
            </div>
            <p class="menu_price">${item.price}$</p>

        </div>
        <div class="bottom">`

  for (const tag of item.tags) {
    if (tag[0] === 'g') {
      html += `<div class="tag tag_green"><p>${tag[1]}</p></div>`
    } else if (tag[0] === 'b') {
      html += `<div class="tag tag_blue"><p>${tag[1]}</p></div>`
    }
  }

  html += `<button class="button_add"><i class="bi bi-plus-lg"></i></button>
        </div>
    </div>
    `;

  return html;
};


export const generateMenu = (menu, filterType = null) => {
  const menu_items = document.getElementById('menu_items');
  menu_items.innerHTML = '';
  for (const item of menu) {
    if (filterType && filterType !== 'All' && item.type !== filterType) {
      continue;
    }
    menu_items.innerHTML += generateMenuItem(item);
  }

  // Change title
  const menu_type = document.getElementById('menu_type');
  if (menu_type) {
    menu_type.textContent = filterType || 'All';
  }

  // Change active button
  const menu_filters_buttons = document.querySelectorAll('.menu_filters_button');
  menu_filters_buttons.forEach(button => {
    button.classList.remove('active');
  });
  const active_button = document.querySelector(`.menu_filters_button[value="${filterType || 'All'}"]`);
  if (active_button) {
    active_button.classList.add('active');
  }
};
