$(document).ready(function () {
    if (localStorage.getItem('isLoggedIn') === null) {
        alert("Utilisateur non connecté.");
        window.location.href = '../views/signin.html';
    }
    $('.container').css('display', 'block');

    loadUserInfo();

    $('#filterButton').on('click', function () {
        applyFilters();
    });

    $('#afficherTout').on('click', function () {
        showAllTransactions();
    });

    $('#downloadCSV').on('click', function () {
        downloadCSVHandler();
    });
});

const userId = localStorage.getItem('userId');

function loadUserInfo() {
    const username = localStorage.getItem('username');
    if (username) {
        $('#welcomeMessage').text(`Vos comptes`);
        fetchAccountsForUser(userId);
    } else {
        console.error("Utilisateur non trouvé.");
        window.location.href = '../views/signin.html';
    }
}

function fetchAccountsForUser(userId) {
    $.ajax({
        url: `http://localhost:8000/accounts?userId=${userId}`,
        type: 'GET',
        success: function (accounts) {
            displayAccounts(accounts);
            populateAccountFilter(accounts);
            fetchTransactionsForUser(userId);
        },
        error: function (error) {
            console.error("Erreur lors du chargement des comptes :", error);
            alert("Erreur lors du chargement des comptes. Veuillez réessayer.");
        }
    });
}

function displayAccounts(accounts) {
    const accountsTableBody = $('#accountsTableBody');
    accountsTableBody.empty();

    let totalBalance = 0;

    if (accounts.length === 0) {
        accountsTableBody.append('<tr><td colspan="2" class="text-center">Aucun compte trouvé.</td></tr>');
    } else {
        accounts.forEach(account => {
            const row = `<tr>
                <td>${account.name}</td>
                <td>${account.balance.toFixed(2)} €</td>
            </tr>`;
            accountsTableBody.append(row);
            totalBalance += account.balance;
        });
    }

    $('#totalBalance').text(`Solde Total: ${totalBalance.toFixed(2)}€`);
}

function populateAccountFilter(accounts) {
    const filterAccount = $('#filterAccount');
    filterAccount.empty();
    filterAccount.append('<option value="">Sélectionner</option>');

    accounts.forEach(account => {
        filterAccount.append(`<option value="${account.id}">${account.name}</option>`);
    });
}

function fetchTransactionsForUser(userId) {
    $.ajax({
        url: `http://localhost:8000/transactions`,
        type: 'GET',
        success: function (transactions) {
            const userTransactions = transactions.filter(transaction =>
                transaction.fromUserId === userId || transaction.toUserId === userId
            );
            displayTransactions(userTransactions, userId);
        },
        error: function (error) {
            console.error("Erreur lors du chargement des transactions :", error);
            alert("Erreur lors du chargement des transactions. Veuillez réessayer.");
        }
    });
}

function displayTransactions(transactions, userId) {
    const transactionTableBody = $('#transactionTableBody');
    transactionTableBody.empty();

    if (transactions.length === 0) {
        $('#noTransactionMessage').show();
    } else {
        $('#noTransactionMessage').hide();
        transactions.forEach(transaction => {
            let transactionType = "N/A";
            if (transaction.fromUserId === userId && transaction.toUserId !== userId) {
                transactionType = "Envoyé";
            } else if (transaction.toUserId === userId && transaction.fromUserId !== userId) {
                transactionType = "Reçu";
            } else if (transaction.fromUserId === userId && transaction.toUserId === userId) {
                transactionType = "Transfert interne";
            } else {
                transactionType = "Transfert externe";
            }

            const fromAccountName = getAccountName(transaction.fromAccountId);
            const toAccountName = getAccountName(transaction.toAccountId);

            const row = `<tr>
                <td>${new Date(transaction.date).toLocaleDateString()}</td>
                <td>${transaction.description}</td>
                <td>${transaction.amount.toFixed(2)} €</td>
                <td>${transactionType}</td>
                <td>${fromAccountName}</td>
                <td>${toAccountName}</td>
            </tr>`;
            transactionTableBody.append(row);
        });
    }
}

function getAccountName(accountId) {
    if (!accountId) return "N/A";
    const accounts = getUserAccounts();
    const account = accounts.find(acc => acc.id === accountId);
    return account ? account.name : "N/A";
}

function getUserAccounts() {
    let accounts = [];
    $.ajax({
        url: `http://localhost:8000/accounts?userId=${userId}`,
        type: 'GET',
        async: false,
        success: function (data) {
            accounts = data;
        },
        error: function (error) {
            console.error("Erreur lors de la récupération des comptes :", error);
            alert("Erreur lors de la récupération des comptes. Veuillez réessayer.");
        }
    });
    return accounts;
}

function applyFilters() {
    const filterType = $('#filterType').val();
    const filterDate = $('#filterDate').val();
    const filterDateRange = $('#filterDateRange').val();
    const filterAccount = $('#filterAccount').val();

    $.ajax({
        url: 'http://localhost:8000/transactions',
        type: 'GET',
        success: function (transactions) {
            let filteredTransactions = transactions.filter(transaction =>
                transaction.fromUserId === userId || transaction.toUserId === userId
            );

            if (filterType === "envoye") {
                filteredTransactions = filteredTransactions.filter(transaction => transaction.fromUserId === userId);
            } else if (filterType === "recu") {
                filteredTransactions = filteredTransactions.filter(transaction => transaction.toUserId === userId);
            }

            if (filterAccount) {
                filteredTransactions = filteredTransactions.filter(transaction =>
                    transaction.fromAccountId === filterAccount || transaction.toAccountId === filterAccount
                );
            }

            if (filterDate) {
                const selectedDate = new Date(filterDate);
                filteredTransactions = filteredTransactions.filter(transaction => {
                    const transactionDate = new Date(transaction.date);
                    return transactionDate.toDateString() === selectedDate.toDateString();
                });
            }

            if (filterDateRange) {
                const currentDate = new Date();
                let pastDate;

                if (filterDateRange === "7") {
                    pastDate = new Date();
                    pastDate.setDate(currentDate.getDate() - 7);
                } else if (filterDateRange === "30") {
                    pastDate = new Date();
                    pastDate.setDate(currentDate.getDate() - 30);
                } else if (filterDateRange === "90") {
                    pastDate = new Date();
                    pastDate.setDate(currentDate.getDate() - 90);
                } else if (filterDateRange === "all") {
                    pastDate = null;
                }

                if (pastDate) {
                    filteredTransactions = filteredTransactions.filter(transaction => {
                        const transactionDate = new Date(transaction.date);
                        return transactionDate >= pastDate && transactionDate <= currentDate;
                    });
                }
            }

            displayTransactions(filteredTransactions, userId);
        },
        error: function (error) {
            console.error("Erreur lors de l'application des filtres :", error);
            alert("Erreur lors de l'application des filtres. Veuillez réessayer.");
        }
    });
}

function showAllTransactions() {
    $.ajax({
        url: 'http://localhost:8000/transactions',
        type: 'GET',
        success: function (transactions) {
            const userTransactions = transactions.filter(transaction =>
                transaction.fromUserId === userId || transaction.toUserId === userId
            );
            displayTransactions(userTransactions, userId);
        },
        error: function (error) {
            console.error("Erreur lors du chargement des transactions :", error);
            alert("Erreur lors du chargement des transactions. Veuillez réessayer.");
        }
    });
}

function convertTableToCSV() {
    const rows = [];
    const headers = ["Date", "Description", "Montant (€)", "Type de Transaction", "Compte Expéditeur", "Compte Destinataire"];
    rows.push(headers.join(";"));

    $('#transactionTableBody tr').each(function () {
        const cols = [];
        $(this).find('td').each(function () {
            let data = $(this).text().trim();
            data = data.replace(/"/g, '""');
            if (data.search(/("|;|\n)/g) >= 0) {
                data = `"${data}"`;
            }
            cols.push(data);
        });
        rows.push(cols.join(";"));
    });

    const csvContent = "\uFEFF" + rows.join("\n");
    return csvContent;
}

function downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    if (navigator.msSaveBlob) {
        navigator.msSaveBlob(blob, filename);
    } else {
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
}

function downloadCSVHandler() {
    const csv = convertTableToCSV();
    if (csv.split("\n").length <= 1) {
        alert("Aucune transaction à télécharger.");
        return;
    }
    downloadCSV(csv, "historique_transactions.csv");
}
