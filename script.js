let elBtnGetContact = document.querySelector(".btn_contact");

elBtnGetContact.addEventListener("click", () => {
  getContacts();
});

let elBtnGetTasks = document.querySelector(".btn_tasks");

elBtnGetTasks.addEventListener("click", () => {
  getTasks();
});


let limit = 1;

let page = 1;

const HOST = "https://introverttesttask2.amocrm.ru";

let apiRoutes = {
  contacts: "/api/v4/contacts?order[id]=asc",  // наверное, выборку лучше делать с сортировкой, что бы не задублировать одинаковые контакты на разных страницах
  tasks: "/api/v4/tasks",
};

let listMessages = {
  get_error_contacts: {
    tag: "json_contact",
    messages: "Что-то пошло не так c получением контактов.",
  },
  no_contacts: {
    tag: "json_contact",
    messages: "В базе больше нет контактов.",
  },
  get_error_tasks: {
    tag: "json_tasks",
    messages: "Что-то пошло не так c загрузкой задач.",
  },
};

const taskLabel = "Контакт без сделок";

const TOKEN_AMO =
  "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6IjU0NmMzNGJmN2IyYzFjYzBjOTg2MTY5Y2NhMmQ2Y2EwY2MzMzJiZDc0YmRkZjAzZTg1Y2VlYzU5ZmY4ODY2NTI4NmQxMzE3ZTdlMjdhOWFkIn0.eyJhdWQiOiI3ZDE2NDM1NS1mNmM3LTQwZTgtOTY5ZS02MGNmMzdmZTg3OGQiLCJqdGkiOiI1NDZjMzRiZjdiMmMxY2MwYzk4NjE2OWNjYTJkNmNhMGNjMzMyYmQ3NGJkZGYwM2U4NWNlZWM1OWZmODg2NjUyODZkMTMxN2U3ZTI3YTlhZCIsImlhdCI6MTczMTUwNzA2MSwibmJmIjoxNzMxNTA3MDYxLCJleHAiOjE3NjE5NTUyMDAsInN1YiI6IjExNzU2MTMwIiwiZ3JhbnRfdHlwZSI6IiIsImFjY291bnRfaWQiOjMyMDY0ODk0LCJiYXNlX2RvbWFpbiI6ImFtb2NybS5ydSIsInZlcnNpb24iOjIsInNjb3BlcyI6WyJjcm0iLCJmaWxlcyIsImZpbGVzX2RlbGV0ZSIsIm5vdGlmaWNhdGlvbnMiLCJwdXNoX25vdGlmaWNhdGlvbnMiXSwiaGFzaF91dWlkIjoiZGY4ZTE0NjYtMTMxNi00YzUwLTk3MGUtMGJjZDcyYjQyNjRkIiwiYXBpX2RvbWFpbiI6ImFwaS1iLmFtb2NybS5ydSJ9.MDBmnsoDH6nUexMWCo5cwAdSnhZtuPcSuipQ3F0SD8bDYX52uJdl-FEpyxcGpXAouShGOcu67Wz1ioVQnu5E-9AXx0wtURjFVhKOx30xPIKJoaOJDflc8SLM9-w49o3sWiSl3ixqCG5DoLA7Erz1Au5f7gWItlFlDICpqZZ9oZZSQ5bZ2LlM8q6BRJ67nmEAVndNYr5c0yD0YmcB1lnl1y3IhMB2nCKWbIVcQE-eJGxDCWLmtk6qmDzH0eAnle0yGd7iX7yMQuQUmsplmti03kpeIGmLt0ywqh3QxgLEtxjPuY-fb-oumM5pIaQJ4EitdyF13-j_WE4r4y7PjweG_A";


function request(
  params = {
    url: "",
    metod: "GET",
    data: {},
    callback: null,
  }
) {
  $.ajax({
    crossDomain: true,
    url: HOST + params.url,
    method: params.metod,
    data: params.data,
    dataType: "json",
    headers: {
      Authorization: "Bearer" + " " + TOKEN_AMO,
      // contentType: "application/json",
    },
  })
    .done(function (data, jqXHR) {
      params.callback ?
        params.callback(data, jqXHR)
        :
        console.log("Забыли передать в запрос callback");
    })
    .fail(function (error, textStatus) {
      params.callback ?
        params.callback(error, textStatus)
        :
        console.log("Забыли передать в запрос callback");
      return false;
    });
}

function outputMessage(tag, messages){
  const dataString = JSON.stringify(messages, null, "  ");
  document.getElementById(tag).innerHTML = dataString;
}

function getContacts() {
  request({
    url: apiRoutes.contacts,
    metod: "GET",
    data: {
      limit: limit,
      with: "leads",
      page: page,
    },
    callback: (response, status) => {

      if(status === "error") {
        outputMessage(
          listMessages.get_error_contacts.tag,
          listMessages.get_error_contacts.messages
        );

        return;
      }

      if(status === "nocontent") {
        outputMessage(
          listMessages.no_contacts.tag,
          listMessages.no_contacts.messages
        );

        return;
      }

      console.log('getContacts>>>', response, status);

      if(!!response._embedded.contacts){
        let contacts = response._embedded.contacts

        let contactsWithoutLeads = checkLeads(contacts);

        getTasks(contactsWithoutLeads);

        page++;
      }
      getContacts();  // рекурсивно пробегаемся по всем страницам контактов
    },
  });
}

function checkLeads(listContacts){
  console.log('checkLeads>>>', listContacts);

  let idContactsNoLeads = []

  listContacts.forEach(contact => {
    if(!contact._embedded.leads.length) {
      idContactsNoLeads.push(contact.id);
    }
  });

  return idContactsNoLeads;
}

function getTasks(contactsWithoutLeads){
  console.log('checkDoubleTasks>>>', contactsWithoutLeads);
  let filterApiTask = "?filter[task_type]=1&filter[is_completed]=0&filter[entity_type]=contacts";

  request({
    url: apiRoutes.tasks + filterApiTask,
    metod: "GET",
    callback: (response, status) => {
      console.log('getTasks>>>', response, status, response);

      if(status === "error") {
        outputMessage(
          listMessages.get_error_tasks.tag,
          listMessages.get_error_tasks.messages
        );
        return;
      }

      if(status === "nocontent") {
        createTasks(contactsWithoutLeads);
        return;
      }



    },
  });

}

function createTasks(listIdContactsNoLeads){
  console.log('createTasks>>', listIdContactsNoLeads);

  let packageLeads = [];

  listIdContactsNoLeads.forEach(idContact => {
    packageLeads.push(
      {
        task_type_id: 1,
        text: taskLabel,
        entity_id: idContact,
        entity_type: "contacts",
        "complete_till": 1588885140,
      }
    );
  });

  request({
    url: apiRoutes.tasks,
    metod: "POST",
    data: JSON.stringify(packageLeads),
    callback: (response, status) => {
      console.log('создание задачь >>>', response, status);
    },
  });

}

// function getTasks() {

//   request({
//     url: "/api/v4/tasks",
//     metod: "GET",
//     data: {
//       limit: limit,
//       page: page,
//     },
//     callback: (response) => {
//       console.log(response);
//     },
//   });
//   page++;

// }
// checkDoubleTasks
