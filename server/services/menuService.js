const { query, getConnection } = require('../db')

// Functions for working with menu
async function loadMenu() {
  const menuItems = await query(`
    SELECT 
      m.id,
      m.type,
      m.title,
      m.description,
      m.price,
      m.created_at,
      m.updated_at,
      GROUP_CONCAT(DISTINCT CONCAT(mt.color, ':', mt.name) SEPARATOR ',') as tags,
      GROUP_CONCAT(DISTINCT mad.day_of_week ORDER BY mad.day_of_week SEPARATOR ',') as availableDays
    FROM menu m
    LEFT JOIN menu_item_tags mit ON m.id = mit.menu_id
    LEFT JOIN menu_tags mt ON mit.tag_id = mt.id
    LEFT JOIN menu_available_days mad ON m.id = mad.menu_id
    GROUP BY m.id, m.type, m.title, m.description, m.price, m.created_at, m.updated_at
    ORDER BY m.id
  `)

  return menuItems.map((item) => ({
    id: item.id,
    type: item.type,
    title: item.title,
    description: item.description,
    price: parseFloat(item.price),
    tags: item.tags
      ? item.tags.split(',').map((tag) => {
          const [color, name] = tag.split(':')
          return [color, name]
        })
      : [],
    availableDays: item.availableDays
      ? item.availableDays.split(',').map((day) => parseInt(day))
      : [],
  }))
}

async function loadMenuByDays(selectedDays) {
  const placeholders = selectedDays.map(() => '?').join(',')
  const menuItems = await query(
    `
    SELECT DISTINCT
      m.id,
      m.type,
      m.title,
      m.description,
      m.price,
      m.created_at,
      m.updated_at,
      GROUP_CONCAT(DISTINCT CONCAT(mt.color, ':', mt.name) SEPARATOR ',') as tags,
      GROUP_CONCAT(DISTINCT mad.day_of_week ORDER BY mad.day_of_week SEPARATOR ',') as availableDays
    FROM menu m
    INNER JOIN menu_available_days mad ON m.id = mad.menu_id
    LEFT JOIN menu_item_tags mit ON m.id = mit.menu_id
    LEFT JOIN menu_tags mt ON mit.tag_id = mt.id
    WHERE mad.day_of_week IN (${placeholders})
    GROUP BY m.id, m.type, m.title, m.description, m.price, m.created_at, m.updated_at
    ORDER BY m.id
  `,
    selectedDays
  )

  return menuItems.map((item) => ({
    id: item.id,
    type: item.type,
    title: item.title,
    description: item.description,
    price: parseFloat(item.price),
    tags: item.tags
      ? item.tags.split(',').map((tag) => {
          const [color, name] = tag.split(':')
          return [color, name]
        })
      : [],
    availableDays: item.availableDays
      ? item.availableDays.split(',').map((day) => parseInt(day))
      : [],
  }))
}

async function createMenuItem(type, title, description, price, tags = [], availableDays = []) {
  const conn = await getConnection()
  try {
    await conn.beginTransaction()

    // Insert menu item
    const menuResult = await conn.query(
      'INSERT INTO menu (type, title, description, price) VALUES (?, ?, ?, ?)',
      [type, title, description, price]
    )
    const menuId = menuResult.insertId

    // Insert tags if provided
    if (tags.length > 0) {
      for (const [color, name] of tags) {
        // Get or create tag
        let tagResult = await conn.query(
          'SELECT id FROM menu_tags WHERE color = ? AND name = ?',
          [color, name]
        )

        let tagId
        if (tagResult.length === 0) {
          const insertTagResult = await conn.query(
            'INSERT INTO menu_tags (color, name) VALUES (?, ?)',
            [color, name]
          )
          tagId = insertTagResult.insertId
        } else {
          tagId = tagResult[0].id
        }

        // Link menu item to tag
        await conn.query('INSERT INTO menu_item_tags (menu_id, tag_id) VALUES (?, ?)', [
          menuId,
          tagId,
        ])
      }
    }

    // Insert available days
    if (availableDays.length > 0) {
      for (const day of availableDays) {
        await conn.query(
          'INSERT INTO menu_available_days (menu_id, day_of_week) VALUES (?, ?)',
          [menuId, day]
        )
      }
    }

    await conn.commit()

    // Load the created item with all relations
    const newItem = (await loadMenu()).find((item) => item.id === menuId)

    return newItem
  } catch (error) {
    await conn.rollback()
    throw error
  } finally {
    conn.release()
  }
}

async function updateMenuItem(itemId, type, title, description, price, tags, availableDays) {
  const conn = await getConnection()
  try {
    await conn.beginTransaction()

    // Check if menu item exists
    const existingItem = await conn.query('SELECT id FROM menu WHERE id = ?', [itemId])
    if (existingItem.length === 0) {
      await conn.rollback()
      throw new Error('Menu item not found')
    }

    // Update menu item
    await conn.query(
      'UPDATE menu SET type = ?, title = ?, description = ?, price = ? WHERE id = ?',
      [type, title, description, price, itemId]
    )

    // Update tags if provided
    if (tags !== undefined) {
      // Delete existing tags
      await conn.query('DELETE FROM menu_item_tags WHERE menu_id = ?', [itemId])

      // Insert new tags
      if (tags.length > 0) {
        for (const [color, name] of tags) {
          let tagResult = await conn.query(
            'SELECT id FROM menu_tags WHERE color = ? AND name = ?',
            [color, name]
          )

          let tagId
          if (tagResult.length === 0) {
            const insertTagResult = await conn.query(
              'INSERT INTO menu_tags (color, name) VALUES (?, ?)',
              [color, name]
            )
            tagId = insertTagResult.insertId
          } else {
            tagId = tagResult[0].id
          }

          await conn.query('INSERT INTO menu_item_tags (menu_id, tag_id) VALUES (?, ?)', [
            itemId,
            tagId,
          ])
        }
      }
    }

    // Update available days if provided
    if (availableDays !== undefined) {
      // Delete existing days
      await conn.query('DELETE FROM menu_available_days WHERE menu_id = ?', [itemId])

      // Insert new days
      if (availableDays.length > 0) {
        for (const day of availableDays) {
          await conn.query(
            'INSERT INTO menu_available_days (menu_id, day_of_week) VALUES (?, ?)',
            [itemId, day]
          )
        }
      }
    }

    await conn.commit()

    // Load the updated item
    const updatedItem = (await loadMenu()).find((item) => item.id === itemId)

    return updatedItem
  } catch (error) {
    await conn.rollback()
    throw error
  } finally {
    conn.release()
  }
}

async function deleteMenuItem(itemId) {
  // Check if menu item exists
  const existingItem = await query('SELECT id FROM menu WHERE id = ?', [itemId])
  if (existingItem.length === 0) {
    throw new Error('Menu item not found')
  }

  // Delete menu item (cascade will handle related records)
  await query('DELETE FROM menu WHERE id = ?', [itemId])
}

module.exports = {
  loadMenu,
  loadMenuByDays,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
}
