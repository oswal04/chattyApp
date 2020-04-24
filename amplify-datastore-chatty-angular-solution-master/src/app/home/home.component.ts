import { Component, OnInit, OnDestroy } from '@angular/core';
import { Auth } from 'aws-amplify';
import * as Observable from 'zen-observable';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { DataStore, Predicates } from "@aws-amplify/datastore";
import { Chatty } from "../../models";
import * as moment from "moment";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {
  subscription;
  moment = moment;
  user;
  messages: Array<Chatty>;
  loading = true;
  public createForm: FormGroup;

  constructor(
    private fb: FormBuilder
  ) {
    Auth.currentAuthenticatedUser().then(cognitoUser => {
      this.user = cognitoUser.username
      console.log(this.user)
    })
  }

  loadMessages() {
    DataStore.query<Chatty>(Chatty, Predicates.ALL)
    .then(messages => {
      this.loading = false;
      this.messages = [...messages].sort((a, b) => -a.createdAt.localeCompare(b.createdAt));
    })
  }

  ngOnInit() {
    this.createForm = this.fb.group({
      'message': ['', Validators.required],
    });

    this.loading = true;
    this.loadMessages();

    //Subscribe to changes
    this.subscription = DataStore.observe<Chatty>(Chatty).subscribe(msg => {
      console.log(msg.model, msg.opType, msg.element);
      this.loadMessages();
    });
  }

  ngOnDestroy() {
    if (!this.subscription) return;
    this.subscription.unsubscribe();
  }
  
  public onCreate(message: any) {
    if ( message.message=="" ) return;
    DataStore.save(
      new Chatty({
        user: this.user,
        message: message.message
      })
    ).then(() => {
      console.log('item created!');
      this.createForm.reset();
      this.loadMessages();
    })
    .catch(e => {
      console.log('error creating message...', e);
    });
  }

  public async onDeleteAll() {
    await DataStore.delete<Chatty>(Chatty, Predicates.ALL)
    .then(() => this.loadMessages())
    .catch(e => {
      console.log('error deleting all messages...', e);
    });
  }

}