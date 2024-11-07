public with sharing class LightningLookup {

    @AuraEnabled(cacheable=true)
    public static Map<String, ResultProperties> getLookupList(String sObjectName, String filters, String referenceField) {
        Map<String, ResultProperties> resultsMap = new Map<String, ResultProperties>();

        List<String> filtersList = new List<String>();

        Map<String, Object> qFilters = (Map<String, Object>) JSON.deserializeUntyped(filters);
        if (!qFilters.keySet().isEmpty()) {
            List<String> fields = new List<String>(qFilters.keySet());
            for (Integer i=0; i<fields.size(); i++) {
                String fieldName = fields[i];
                
                Map<String, Object> fieldFilters = (Map<String, Object>) qFilters.get(fieldName);
                
                for (String operatorStr : fieldFilters.keySet()) {
                    // filter: fieldName operator value
                    filtersList.add(fieldName+' '+operatorStr+' \''+fieldFilters.get(operatorStr)+'\'');
                }
            }
        }

        String q = 'SELECT Id, Name ';
        if (String.isNotBlank(referenceField) && referenceField != 'Id' && referenceField != 'Name') {
            q += ', '+referenceField;
        }
        q += ' FROM '+sObjectName;
        if (!filtersList.isEmpty()) {
            q += ' WHERE ' + String.join(filtersList, ' AND ');
        }
        q += ' LIMIT 50 '; 
        
        Map<Id, Account> accounts = new Map<Id, Account>([SELECT Id, Name FROM Account]);
        
        List<SObject> qResult = Database.query(q);
        
        for (sObject s : qResult) {
            String name = String.valueOf(s.get('Name'));

            ResultProperties o = new ResultProperties();
            o.name = s.Id;
            o.label = name;

            if (String.isNotBlank(referenceField)) {
                String refFieldValue = String.valueOf( s.get(referenceField) );
                if (accounts.containsKey(refFieldValue)) {
                    o.reference = name + ' (' + accounts.get( refFieldValue ).Name +')';
                } else {
                    o.reference = name + ' (' + refFieldValue +')';
                }
            }
            
            resultsMap.put(name, o);
        }

        return resultsMap;
    }

    public class ResultProperties {
        @AuraEnabled public String name {get; set;} // Result API Name / Id
        @AuraEnabled public String label {get; set;} // Result Label
        
        // reference will be the value displayed to the user. There can be results with the same label.
        @AuraEnabled public String reference {get; set;}
    }
    
}