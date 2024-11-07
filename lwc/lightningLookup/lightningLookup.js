import { LightningElement, api, track } from 'lwc';

import getLookupList from '@salesforce/apex/LightningLookup.getLookupList';

export default class ExampleObjectSearch extends LightningElement {

    @track autoCompleteOptions = []; // filtered list of options based on search string
    @track resultsList = []; // complete list of results returned by the apex method
    @track resultsMap = {}; // useful to get a map

    @api label = 'Search';
    @api variant = '';
    @api selectedValue = '';
    @api disabled = false;
    @api isRequired = false;
    @api sObjectName = '';
    @api filters = '{}';
    @api referenceField = '';

    isInput = true;
    displayList = false;
    
    inputValue = '';
    get filtersFilled() {
        return this.filters?.replace('var', this.inputValue);
    }
    get variantParam() {
        return this.variant;
    }

    @api validate() {
        // to be called from parent LWC if for example the search box is present
        // on a form and needs to be validated before submission.
        this.template.querySelector('lightning-input').reportValidity();
    }

    /**
     * Getter and setters
     */
    _selectedNode = {};
    get selectedValueAux() {
        return this._selectedNode.label;
    }

    async loadValues() {
        this.hideList();
        this.loading(true);

        await getLookupList({sObjectName: this.sObjectName, filters: this.filtersFilled, referenceField: this.referenceField})
            .then((data) => {
                this.resultsMap = JSON.parse(JSON.stringify(data)); // Deep copy of object
                this.resultsList = Object.values(this.resultsMap); // used for the auto-complete functionality

                if (this.resultsList.length > 0) {
                    this.autoCompleteOptions = this.resultsList.filter(item => item.reference.toLowerCase().includes(this.inputValue.toLowerCase()));
            
                    // makes visible the combobox, expanding it.
                    if (this.autoCompleteOptions.length && this.inputValue && !this.displayList) {
                        this.displayList = true;
                        setTimeout(() => { this.handleListNavigation(true); }, 100);
                    }
                }
            })
            .catch((error) => {
                console.error("Lookup Error", error);
            })
            .finally(() => {
                this.loading(false);
            });
        
    }


    typingTimer;               //timer identifier
    doneTypingInterval = 500;  //time in ms, 5 seconds for example

    /**
     * Handlers
     */
    handleOnClick(event) {
        if (this.autoCompleteOptions.length && this.inputValue) {
            this.displayList = true;
        }
    }

    handleInputChange(event) {
        clearTimeout(this.typingTimer);
        this.typingTimer = setTimeout(this.applyInputChange.bind(this, event.target.value), this.doneTypingInterval);
    }

    applyInputChange(value) {
        this.selectedValue = ''; // resets the selected object whenever the search box is changed
        const inputVal = value; // gets search input value
        
        this.hideList();
        this.resultsList = [];
        this.resultsMap = {};
        this.inputValue = inputVal;

        this.loadValues();
    }

    handleOnBlur(event) {
        // Trickiest detail of this LWC.
        // the setTimeout is a workaround required to ensure the user click selects the record.
        /* */
        setTimeout(() => {
            this.hideList();
        }, 300);
        /* */
    }

    handleOptionClick(event) {
        // Stores the selected objected and hides the combobox
        this.selectedValue = event.currentTarget?.dataset?.name;
        this._selectedNode = JSON.parse(JSON.stringify(event.currentTarget?.dataset));
        this.hideList();

        this.isInput = false;

        // throw custom event to be caught by parent LWC
        const selectedEvent = new CustomEvent('select', { detail: this._selectedNode });
        this.dispatchEvent(selectedEvent);
    }

    handlePillClick() {
        this.isInput = true;
    }

    hideList() {
        this.handleListNavigation(false);
        this.displayList = false;
    }

    listItems = [];
    focusedListItem = null;
    eventListenerActive = false;
    handleListNavigation(activate) {
        this.listItems = [];
        this.focusedListItem = null;
        
        this.template.removeEventListener("keydown", this.handleKeyDown.bind(this));
        if (activate && !this.eventListenerActive) {
            this.template.querySelector('.slds-listbox').focus();
            this.template.addEventListener("keydown", this.handleKeyDown.bind(this));
            this.eventListenerActive = true;
        }
    }

    handleKeyDown(event) {
        this.listItems = this.template.querySelectorAll('li');
        if (!this.listItems || !this.displayList) return;

        this.listItems[this.focusedListItem]?.querySelector('div')?.classList?.remove('hoverListItem');
        if (event.which === 40) { // downArrowKey
            if (this.focusedListItem == null || this.focusedListItem == this.listItems.length-1)
                this.focusedListItem = 0;
            else
                this.focusedListItem++;

            this.hoverElement();
        }
        else if (event.which === 38) { // upArrowKey
            if (this.focusedListItem == null || this.focusedListItem == 0)
                this.focusedListItem = this.listItems.length-1;
            else
                this.focusedListItem--;
        
            this.hoverElement();
        }
        else if (event.key === "Enter") {
            this.listItems[this.focusedListItem].click();
        }
    }

    hoverElement() {
        let scrollOptions = { behavior: "smooth", block: "nearest", inline: "nearest" };

        this.listItems[this.focusedListItem].scrollIntoView(scrollOptions);
        this.listItems[this.focusedListItem].querySelector('div').classList.add('hoverListItem');
        this.listItems[this.focusedListItem].querySelector('div.slds-media').focus();
    }

    loading(value) {
        this.dispatchEvent(new CustomEvent('loading', {
            detail: { value }
        }));
    }
}
