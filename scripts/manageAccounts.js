$(document).ready(function () {
    if (localStorage.getItem('isLoggedIn') === null) {
        alert("Utilisateur non connecté.");
        window.location.href = '../views/signin.html';
    }
    $('.container').css('display', 'block');
    loadExistingAccounts();

    $('#addAccountForm').on('submit', function (e) {
        e.preventDefault();
        addNewAccount();
    });
} );
const sanitizeInput = (input) =>  DOMPurify.sanitize(input);// Échappe les caractères spéciaux
const userId = sanitizeInput(localStorage.getItem('userId')); // Nettoyage ajouté

function loadExistingAccounts() {
    $.ajax({
        url: `http://localhost:8000/accounts?userId=${sanitizeInput(userId)}`, // Nettoyage ajouté
        type: 'GET',
        success: function (accounts) {
            const sanitizedAccounts = accounts.map(account => ({
                ...account,
                name: sanitizeInput(account.name), // Nettoyage ajouté
                type: sanitizeInput(account.type) // Nettoyage ajouté
            }));
            displayExistingAccounts(sanitizedAccounts);
        },
        error: function (error) {
            console.error("Erreur lors du chargement des comptes :", error);
            showErrorMessage("Erreur lors du chargement de vos comptes. Veuillez réessayer.");
        }
    });
}

function displayExistingAccounts(accounts) {
    const existingAccountsTableBody = $('#existingAccountsTableBody');
    existingAccountsTableBody.empty();

    if (accounts.length === 0) {
        existingAccountsTableBody.append('<tr><td colspan="4" class="text-center">Aucun compte trouvé.</td></tr>');
    } else {
        accounts.forEach(account => {
            const row = `<tr>
                <td>${sanitizeInput(account.name)}</td>  <!-- Nettoyage ajouté -->
                <td>${sanitizeInput(account.type)}</td>  <!-- Nettoyage ajouté -->
                <td>${account.balance.toFixed(2)} €</td>
                <td>
                    <div class="btn-group" role="group">
                        <button class="btn btn-success btn-sm" onclick="depositToAccount('${sanitizeInput(account.id)}')">Dépôt</button> <!-- Nettoyage ajouté -->
                        <button class="btn btn-warning btn-sm ml-2" onclick="withdrawFromAccount('${sanitizeInput(account.id)}')">Retrait</button> <!-- Nettoyage ajouté -->
                        <button class="btn btn-danger btn-sm ml-2" onclick="deleteAccount('${sanitizeInput(account.id)}')">Supprimer</button> <!-- Nettoyage ajouté -->
                    </div>
                </td>
            </tr>`;
            existingAccountsTableBody.append(row);
        });
    }
}


function addNewAccount() {
    const accountName = sanitizeInput($('#accountName').val().trim()); // Nettoyage ajouté
    const accountType = sanitizeInput($('#accountType').val()); // Nettoyage ajouté

    $('#successMessage').hide();
    $('#errorMessage').hide();

    if (accountName === "" || accountType === "") {
        showErrorMessage("Veuillez remplir tous les champs.");
        return;
    }

    if (!userId) {
        alert("Utilisateur non connecté.");
        window.location.href = '../views/signin.html';
        return;
    }

    const newAccount = {
        userId: userId,
        name: accountName,
        type: accountType,
        balance: 0
    };

    $.ajax({
        url: 'http://localhost:8000/accounts',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(newAccount),
        success: function () {
            showSuccessMessage("Compte ajouté avec succès !");
            $('#addAccountForm')[0].reset();
            loadExistingAccounts();
        },
        error: function (error) {
            console.error("Erreur lors de l'ajout du compte :", error);
            showErrorMessage("Erreur lors de l'ajout du compte. Veuillez réessayer.");
        }
    });
}

function deleteAccount(accountId) {
    const sanitizedAccountId = sanitizeInput(accountId); // Nettoyage ajouté
    const confirmation = confirm("Êtes-vous sûr de vouloir supprimer ce compte ? Cette action est irréversible.");
    if (!confirmation) return;

    $.ajax({
        url: `http://localhost:8000/accounts/${sanitizedAccountId}`, // Nettoyage ajouté
        type: 'DELETE',
        success: function () {
            showSuccessMessage("Compte supprimé avec succès !");
            loadExistingAccounts();
        },
        error: function (error) {
            console.error("Erreur lors de la suppression du compte :", error);
            showErrorMessage("Erreur lors de la suppression du compte. Veuillez réessayer.");
        }
    });
}

function showErrorMessage(message) {
    const sanitizedMessage = sanitizeInput(message); // Nettoyage ajouté
    $('#errorMessage').text(sanitizedMessage).fadeIn();
    setTimeout(function () {
        $('#errorMessage').fadeOut();
    }, 5000);
}


function showSuccessMessage(message) {
    const sanitizedMessage = sanitizeInput(message); // Nettoyage ajouté
    $('#successMessage').text(sanitizedMessage).fadeIn();
    setTimeout(function () {
        $('#successMessage').fadeOut();
    }, 5000);
}


function depositToAccount(accountId) {
    const sanitizedAccountId = sanitizeInput(accountId); // Nettoyage ajouté
    const depositAmount = prompt("Entrez le montant à déposer :");

    if (!depositAmount || isNaN(depositAmount) || depositAmount <= 0) {
        alert("Montant de dépôt non valide. Veuillez entrer un nombre positif.");
        return;
    }

    $.ajax({
        url: `http://localhost:8000/accounts/${sanitizedAccountId}`, // Nettoyage ajouté
        type: 'GET',
        success: function (account) {
            const newBalance = account.balance + parseFloat(depositAmount);

            $.ajax({
                url: `http://localhost:8000/accounts/${sanitizedAccountId}`,  // Nettoyage ajouté
                type: 'PATCH',
                contentType: 'application/json',
                data: JSON.stringify({ balance: newBalance }),
                success: function () {
                    const transaction = {
                        id: generateTransactionId(),
                        fromUserId: account.userId,
                        toUserId: account.userId,
                        fromAccountId: sanitizedAccountId,  // Nettoyage ajouté
                        toAccountId: sanitizedAccountId,  // Nettoyage ajouté
                        amount: parseFloat(depositAmount),
                        date: new Date().toISOString(),
                        transferType: "deposit",
                        description: `Dépôt de ${parseFloat(depositAmount).toFixed(2)} € sur ${sanitizeInput(account.name)}`, // Nettoyage ajouté
                        senderBalanceAfter: newBalance,
                        recipientBalanceAfter: newBalance
                    };

                    recordTransaction(transaction, function () {
                        showSuccessMessage("Dépôt effectué avec succès !");
                        loadExistingAccounts();  // Reload accounts or refresh UI as necessary
                    });
                },
                error: function (error) {
                    console.error("Erreur lors de la mise à jour du solde :", error);
                    showErrorMessage("Erreur lors du dépôt. Veuillez réessayer.");
                }
            });

        },
        error: function (error) {
            console.error("Erreur lors de la récupération du solde actuel :", error);
            showErrorMessage("Erreur lors de la récupération des informations du compte.");
        }
    });
}


function withdrawFromAccount(accountId) {
    const sanitizedAccountId = sanitizeInput(accountId); // Nettoyage ajouté
    const withdrawAmount = prompt("Entrez le montant à retirer :");
    if (!withdrawAmount || isNaN(withdrawAmount) || withdrawAmount <= 0) {
        alert("Montant de retrait non valide. Veuillez entrer un nombre positif.");
        return;
    }

    $.ajax({
        url: `http://localhost:8000/accounts/${sanitizedAccountId}`, // Nettoyage ajouté
        type: 'GET',
        success: function (account) {
            const currentBalance = account.balance;
            const amountToWithdraw = parseFloat(withdrawAmount);

            if (amountToWithdraw > currentBalance) {
                alert("Fonds insuffisants pour effectuer ce retrait.");
                return;
            }

            const newBalance = currentBalance - amountToWithdraw;

            $.ajax({
                url: `http://localhost:8000/accounts/${sanitizedAccountId}`, // Nettoyage ajouté
                type: 'PATCH',
                contentType: 'application/json',
                data: JSON.stringify({ balance: newBalance }),
                success: function () {
                    const transaction = {
                        id: generateTransactionId(),
                        fromUserId: account.userId,
                        toUserId: account.userId,
                        fromAccountId: sanitizedAccountId,  // Nettoyage ajouté
                        toAccountId: sanitizedAccountId,  // Nettoyage ajouté
                        amount: amountToWithdraw,
                        date: new Date().toISOString(),
                        transferType: "withdrawal",
                        description: `Retrait de ${amountToWithdraw.toFixed(2)} € de ${sanitizeInput(account.name)}`, // Nettoyage ajouté
                        senderBalanceAfter: newBalance,
                        recipientBalanceAfter: newBalance
                    };

                    recordTransaction(transaction, function () {
                        showSuccessMessage("Retrait effectué avec succès !");
                        loadExistingAccounts();
                    });
                },
                error: function (error) {
                    console.error("Erreur lors de la mise à jour du solde :", error);
                    showErrorMessage("Erreur lors du retrait. Veuillez réessayer.");
                }
            });
        },
        error: function (error) {
            console.error("Erreur lors de la récupération du solde actuel :", error);
            showErrorMessage("Erreur lors de la récupération des informations du compte.");
        }
    });
}

function recordTransaction(transaction, callback) {
    const sanitizedTransaction = {
        ...transaction,
        description: sanitizeInput(transaction.description) // Nettoyage ajouté
    };

    $.ajax({
        url: 'http://localhost:8000/transactions',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(sanitizedTransaction), // Utilisation de la transaction nettoyée
        success: function () {
            console.log("Transaction enregistrée avec succès.");
            if (typeof callback === 'function') {
                callback();
            }
        },
        error: function (error) {
            console.error("Erreur lors de l'enregistrement de la transaction :", error);
            showErrorMessage("Erreur lors de l'enregistrement de la transaction.");
        }
    });
}

function generateTransactionId() {
    return Math.random().toString(36).substr(2, 8);
}
