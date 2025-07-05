export function createCheckboxList(checkboxContainer, tags) {
    checkboxContainer.innerHTML = '';
    
    tags.forEach((tag, index) => {
        const checkboxItem = document.createElement('label');
        checkboxItem.className = 'checkbox-item';
        
        checkboxItem.innerHTML = `
            <input type="checkbox" id="item-${index}" value="${tag.tag}">
            <span class="checkbox-label">${tag.tag}</span>
        `;
        
        checkboxContainer.appendChild(checkboxItem);
    });
}

export const getCheckedTags = () => {
  const checkboxContainer = document.getElementById("checkboxContainer");
  return Array.from(checkboxContainer.querySelectorAll('input[type="checkbox"]:checked'))
              .map(checkbox => checkbox.value);
}