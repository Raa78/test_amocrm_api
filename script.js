let limit = 25;

let page = 1;

let timeTaskEnd = 30 // в днях

const API = {
  amocrm: {
    host: "https://introverttestapi.amocrm.ru",
    routes: {
        contacts: "/api/v4/contacts?order[id]=asc",  // наверное, выборку лучше делать с сортировкой, что бы не задублировать одинаковые контакты на разных страницах
        tasks: "/api/v4/tasks",
    }
  }
};

let listMessages = {
  get_error_contacts: {
    tag: "#contact",
    messages: "Что-то пошло не так c получением контактов.",
  },
  no_contacts: {
    tag: "#contacts_processed",
    messages: "Все контакты обработаны.",
  },
  get_error_tasks: {
    tag: "#task",
    messages: "Что-то пошло не так c загрузкой задач.",
  },
  tasks_created:{
    tag: "#task",
    messages: "Задачи созданы.",
  },
  no_tasks_created:{
    tag: "#task",
    messages: "Контактов для создания задач нет.",
  },
  other: {
    no_callback: "Забыли передать в запрос callback"
  },

};

const taskLabel = "Контакт без сделок";

const TOKEN_AMO =
  "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6ImEwMTgxMjA0NWZmZDFmZTQ3ZjhlZGE2MTA1MDZjMjY4YTQzNjZmMGQ2NjI0ZmM4Nzk5ZjBiYTI0MmQzZTdhYmU3MTAyMThkMjc5OWZjNDgzIn0.eyJhdWQiOiJlNjc3ZTU3OC0wOWU5LTQzZDItOGE5OC0wMTlkOTI0NmU0MjUiLCJqdGkiOiJhMDE4MTIwNDVmZmQxZmU0N2Y4ZWRhNjEwNTA2YzI2OGE0MzY2ZjBkNjYyNGZjODc5OWYwYmEyNDJkM2U3YWJlNzEwMjE4ZDI3OTlmYzQ4MyIsImlhdCI6MTczMTU2NDM5NCwibmJmIjoxNzMxNTY0Mzk0LCJleHAiOjE3NjcyMjU2MDAsInN1YiI6IjExNzU2MTMwIiwiZ3JhbnRfdHlwZSI6IiIsImFjY291bnRfaWQiOjMyMDY1ODU4LCJiYXNlX2RvbWFpbiI6ImFtb2NybS5ydSIsInZlcnNpb24iOjIsInNjb3BlcyI6WyJjcm0iLCJmaWxlcyIsImZpbGVzX2RlbGV0ZSIsIm5vdGlmaWNhdGlvbnMiLCJwdXNoX25vdGlmaWNhdGlvbnMiXSwiaGFzaF91dWlkIjoiM2FjOTk4NTYtZWI1YS00NGI5LWIwNTQtMGZjYzY1ODcwMWJlIiwiYXBpX2RvbWFpbiI6ImFwaS1iLmFtb2NybS5ydSJ9.at3ZV4sJjeCDGmqcnakmXXXvsEUua1lsryDC707qmAeHwvsbxrC_bqB0AC8l20hu4AJ-Z_Z53ki1lE-qLExmSmjmHV4tZpPoo97fuDv1e4UyzptnmLMwnhu5CtnYkPjf39PrVBFFkZltIV_OM7vyg8OAOWD-r987o-zKOwY5Tfem5cW04ZdjQ87A4W8Nd2HeCoUWkATVSTjzvcz0-9r69-qLzkWq8YHRnP0li2maSqLDdkzh_bQ2q794T7pU3mNrqKi8fz8Gk9YX8_vjp1TvuNzZADLn1cD6b3AppDpXCGsFn62Z5f8YfpitXmHTOVURjS9GplaniPuvgSv1GbL9nw";


// Шаблон для запроса на API
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
    url: API.amocrm.host + params.url,
    method: params.metod,
    data: params.data,
    dataType: "json",
    headers: {
      Authorization: "Bearer" + " " + TOKEN_AMO,
      contentType: "application/json",
    },
  })
    .done(function (data, jqXHR) {
      params.callback ?
        params.callback(data, jqXHR)
        :
        console.log(listMessages.other.no_callback);
    })
    .fail(function (error, textStatus) {
      params.callback ?
        params.callback(error, textStatus)
        :
        console.log(listMessages.other.no_callback);
      return false;
    });
}

// Вывод сообщений
function outputMessage(tag, messages){
  const dataString = JSON.stringify(messages, null, "  ");
  // $(tag).text(dataString);
  $(tag).append(`<p>${dataString}</p>`);
}


function getContacts() {
  request({
    url: API.amocrm.routes.contacts,
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

  let idContactsNoLeads = []

  listContacts.forEach(contact => {
    if(!contact._embedded.leads.length) {
      idContactsNoLeads.push(contact.id);
    }
  });

  return idContactsNoLeads;
}


function getTasks(contactsWithoutLeads){

  let filterApiTask = "?filter[task_type]=1&filter[is_completed]=0&filter[entity_type]=contacts";

  request({
    url: API.amocrm.routes.tasks + filterApiTask,
    metod: "GET",
    callback: (response, status) => {
      let listContacts = contactsWithoutLeads;

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

      let listTasks = response._embedded.tasks;

      listTasks.forEach(task =>{
        if(task.text == taskLabel){
          let indexContactDel = contactsWithoutLeads.indexOf(task.entity_id);
          if (indexContactDel != -1) {
            listContacts.splice(indexContactDel, 1);
          }
        };
      });

      createTasks(contactsWithoutLeads);
    },
  });
}


function createTasks(listIdContactsNoLeads){

  let packageLeads = [];

  let complete_task = Math.floor(Date.now() / 1000 + timeTaskEnd * 86400);

  listIdContactsNoLeads.forEach(idContact => {
    packageLeads.push(
      {
        task_type_id: 1,
        text: taskLabel,
        entity_id: idContact,
        entity_type: "contacts",
        complete_till: complete_task,
      }
    );
  });

  if (packageLeads.length){
    request({
      url: API.amocrm.routes.tasks,
      metod: "POST",
      data: JSON.stringify(packageLeads),

      callback: (response) => {
        outputMessage(
          listMessages.tasks_created.tag,
          listMessages.tasks_created.messages
        );
        outputMessage(
          listMessages.tasks_created.tag,
          response._embedded.tasks
        );
      },
    });

    return;
  };

  outputMessage(
    listMessages.no_tasks_created.tag,
    listMessages.no_tasks_created.messages,
  );
}


$(".btn_contact").on("click", function() {
  $(this).attr("disabled", true);
  getContacts();
});
