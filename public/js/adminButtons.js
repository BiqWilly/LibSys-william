// Edit and Delete buttons for admin only
function attachAdminButtons(tr, book) {
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
    if (!currentUser || currentUser.role !== "admin") return;

    const tdActions = document.createElement("td");
    tdActions.style.whiteSpace = "nowrap";
    tdActions.setAttribute("data-title", book.title);

    // Edit button
    const editBtn = document.createElement("button");
    editBtn.textContent = "Edit";
    editBtn.className = "btn small edit";
    editBtn.addEventListener("click", () => openEditModal(book));
    tdActions.appendChild(editBtn);

    // Delete button
    const delBtn = document.createElement("button");
    delBtn.textContent = "Remove";
    delBtn.className = "btn small danger";
    delBtn.addEventListener("click", () => openDeleteConfirm(book.title));
    tdActions.appendChild(delBtn);

    tr.appendChild(tdActions);
}

// override loadBooks to attach admin buttons
const originalLoadBooks = window.loadBooks;
window.loadBooks = async function () {
    await originalLoadBooks();

    const tbody = document.querySelector("#book-list");
    const rows = tbody.querySelectorAll("tr");
    const books = window.books || [];

    rows.forEach(tr => {
        const titleCell = tr.querySelector("td:first-child a");
        if (!titleCell) return;

        const book = books.find(b => b.title === titleCell.textContent);
        if (book) attachAdminButtons(tr, book);
    });

    const expireAt = parseInt(localStorage.getItem(SPAM_LOCK_KEY), 10);
    if (expireAt && expireAt > Date.now()) disableDeleteButtons(expireAt);
};