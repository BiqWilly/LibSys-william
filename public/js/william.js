// william.js
// Delete Books

// localStorage keys
const SPAM_LOCK_KEY = "deleteLockExpire";

// confirm delete popup
function openDeleteConfirm(bookTitle) {
    if (!confirm(`Delete "${bookTitle}"? This cannot be undone.`)) return;
    deleteBook(bookTitle); // call backend delete only
}

// delete book request
async function deleteBook(title) {
    try {
        if (!title) {
            alert("missing parameter: title");
            return;
        }

        const res = await fetch(`/delete-book?title=${encodeURIComponent(title)}`, {
            method: "DELETE"
        });

        const data = await res.json();

        if (!res.ok) {
            if (res.status === 429) {
                alert(data.message);
                const expireAt = Date.now() + 25_000; // 25s delete button lock
                localStorage.setItem(SPAM_LOCK_KEY, expireAt.toString());
                disableDeleteButtons(expireAt);
                return;
            }
            alert(data.message);
            return;
        }

        // spam lock from server
        if (res.status === 200 && data.message.includes("Do not spam, wait 25s")) {
            const expireAt = Date.now() + 10_000;
            localStorage.setItem(SPAM_LOCK_KEY, expireAt.toString());
            disableDeleteButtons(expireAt);
        }

        alert(data.message);
        loadBooks(); // refresh table
    } catch (err) {
        console.error("deleteBook frontend error:", err);
        alert("something went wrong — try again later");
    }
}

// disables delete buttons + countdown
function disableDeleteButtons(expireAt) {
    const buttons = document.querySelectorAll(".danger");
    buttons.forEach(btn => {
        btn.disabled = true;
        let span = btn.nextElementSibling;
        if (!span || !span.classList.contains("countdown")) {
            span = document.createElement("span");
            span.className = "countdown";
            span.style.color = "red";
            span.style.marginLeft = "8px";
            btn.parentNode.insertBefore(span, btn.nextSibling);
        }

        function updateCountdown() {
            const now = Date.now();
            const remaining = Math.ceil((expireAt - now) / 1000);
            if (remaining <= 0) {
                btn.disabled = false;
                span.textContent = "";
                localStorage.removeItem(SPAM_LOCK_KEY);
                clearInterval(interval);
            } else {
                span.textContent = `Time Remaining: ${remaining}s`;
            }
        }

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);
    });
}

// Export for Jest / Node
if (typeof module !== 'undefined') {
    module.exports = { openDeleteConfirm, deleteBook, disableDeleteButtons };
}

//testing jenkins trigger