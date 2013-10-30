﻿$(function() {
    var client = new WindowsAzure.MobileServiceClient(
        killertodoUrl, 
        killertodoKey),
        todoItemTable = client.getTable('todoitem');

    // Read current data and rebuild UI.
    // If you plan to generate complex UIs like this, consider using a JavaScript templating library.
    function refreshTodoItems() {
        var query = todoItemTable.where({ complete: false });

        query.read().then(function(todoItems) {
            var listItems = $.map(todoItems, function(item) {
                return $('<li>')
                    .attr('data-todoitem-id', item.id)
                    .append($('<button class="item-delete">Delete</button>'))
                    .append($('<input type="checkbox" class="item-complete">').prop('checked', item.complete))
                    .append($('<div>').append($('<input class="item-text">').val(item.text)));
            });

            $('#todo-items').empty().append(listItems).toggle(listItems.length > 0);
            $('#summary').html('<strong>' + todoItems.length + '</strong> item(s)');
        }, handleError);
    }

    function handleError(error) {
        var text = error + (error.request ? ' - ' + error.request.status : '');
        $('#errorlog').append($('<li>').text(text));
    }

    function getTodoItemId(formElement) {
        return Number($(formElement).closest('li').attr('data-todoitem-id'));
    }

    // Handle insert
    $('#add-item').submit(function(evt) {
        var textbox = $('#new-item-text'),
            itemText = textbox.val();
        if (itemText !== '') {
            todoItemTable.insert({ text: itemText, complete: false }).then(
                refreshTodoItems,
                handleError);
        }
        textbox.val('').focus();
        evt.preventDefault();
    });

    // Handle update
    $(document.body).on('change', '.item-text', function() {
        var newText = $(this).val();
        todoItemTable.update({ id: getTodoItemId(this), text: newText }).then(null, handleError);
    });

    $(document.body).on('change', '.item-complete', function() {
        var isComplete = $(this).prop('checked');
        todoItemTable.update({ id: getTodoItemId(this), complete: isComplete }).then(refreshTodoItems, handleError);
    });

    // Handle delete
    $(document.body).on('click', '.item-delete', function () {
        todoItemTable.del({ id: getTodoItemId(this) }).then(refreshTodoItems, handleError);
    });

    // Handle auth
    function refreshAuthDisplay() {
        var isLoggedIn = client.currentUser !== null;
        $('#logged-in').toggle(isLoggedIn);
        $('#logged-out').toggle(!isLoggedIn);


        if (isLoggedIn) {
            var facebookId = client.currentUser.userId.split(':')[1],
                facebookGraphUri = 'http://graph.facebook.com/' + facebookId + '/';
            $('#login-picture').attr('src', facebookGraphUri + 'picture?type=square');
            $.get(facebookGraphUri + '?fields=name', function(result){
                $('#login-name').text(result.name);
            })
            refreshTodoItems();
        } else {
            $('#summary').html('<strong>You must login to access data.</strong>');
            $('#todo-items').empty();
        }
    }


    function logIn() {
        refreshAuthDisplay();
    }


    function logOut() {
        refreshAuthDisplay();
    }
    
    $("#logged-out button").click(logIn);
    $("#logged-in button").click(logOut);

    refreshAuthDisplay();

});