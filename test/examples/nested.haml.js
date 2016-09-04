const menu = (~
  #menu
    {items.map((item) => (~ %Item(key={item.id} item={item}) ~))}
~)