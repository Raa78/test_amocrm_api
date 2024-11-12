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

const HOST = "https://introverttesttask1.amocrm.ru";

let apiRoutes = {
  contacts: "/api/v4/contacts",
  tasks: "/api/v4/tasks",
};

let listMessages = {
  get_error_contacts: {
    tag: "json_contact",
    messages: "Что-то пошло не так c получением контактов.",
  },
  no_contacts: {
    tag: "json_contact",
    messages: "В базе нет контактов.",
  },
  tasks: {
    tag: "json_tasks",
    messages: "Что-то пошло не так c загрузкой задач.",
  },
};

const taskLabel = "Контакт без сделок";

const TOKEN_AMO =
  "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6IjUwNzZiNmFiY2IzZWM1ZTE4N2I4N2FmOGNjMmQ0NWEyMjcxNDc1MmNiNTA3MGQ5M2M0Njg3NWIzYTE3ODczNTFiM2VlYmM2NjZhNDAzNzgwIn0.eyJhdWQiOiIwNTRlZTliMi0wNjlkLTRhNTMtYWE5MS04ZTA0ZjM4NjI5YTQiLCJqdGkiOiI1MDc2YjZhYmNiM2VjNWUxODdiODdhZjhjYzJkNDVhMjI3MTQ3NTJjYjUwNzBkOTNjNDY4NzViM2ExNzg3MzUxYjNlZWJjNjY2YTQwMzc4MCIsImlhdCI6MTczMTE5MzkzMSwibmJmIjoxNzMxMTkzOTMxLCJleHAiOjE4NjE5MjAwMDAsInN1YiI6IjExNzU2MTMwIiwiZ3JhbnRfdHlwZSI6IiIsImFjY291bnRfaWQiOjMyMDU3NjQyLCJiYXNlX2RvbWFpbiI6ImFtb2NybS5ydSIsInZlcnNpb24iOjIsInNjb3BlcyI6WyJjcm0iLCJmaWxlcyIsImZpbGVzX2RlbGV0ZSIsIm5vdGlmaWNhdGlvbnMiLCJwdXNoX25vdGlmaWNhdGlvbnMiXSwiaGFzaF91dWlkIjoiMzAzM2ZjNzMtMTBhMC00YzVjLThkMmQtMDAyMWRlZDEyZTg0IiwiYXBpX2RvbWFpbiI6ImFwaS1iLmFtb2NybS5ydSJ9.bmgA75Rqcy-BBu9ey0Ip2iJ0fR_e_oOZ5FmeXtCeRM0610G0uc-N_BA2Q9ERF0nYx36n4wCL8r9qJQXsyMcv_mFXCuqXhQFPUJP-xwCkmqIM7w_-BF8_N3-EsP0Yoz0rc3ALuy6rufjNS4aGBwkWcMFWQhapb5IR1qE65GIzfrNH1dU3ADq9h-6V2qJ2jSkUbYgPjOZ7Mez4pUVBNBuBGu0E6fJI_K-VmFxqIZRsB55serShlm_Hwe9oI-iDbIjwix1PUXT2NFXLufQeoH_j0IWho5S5oJcCOtObdMCkKFZVFkDw2j6UPIAf-K1EsXtjrA0Es7TGHI-1j9-f4Q3vDg";


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
        let listContacts = response._embedded.contacts

        let listContactsNoLeads = checkLeads(listContacts);

        createTasks(listContactsNoLeads);

      }

      getContacts();  // рекурсивно пробегаемся по всем страницам контактов
    },
  });

  page++;
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

function createTasks(listIdContactsNoLeads){
  console.log('check_contacts>>', listIdContactsNoLeads);

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
      console.log('создание задачь>>>', response, status);
    },
  });

}

function getTasks() {

  request({
    url: "/api/v4/tasks",
    metod: "GET",
    data: {
      limit: limit,
      page: page,
    },
    callback: (response) => {
      console.log(response);
    },
  });
  page++;

}
