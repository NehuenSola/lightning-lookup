@isTest
private class LightningLookupTest {

    @TestSetup
    static void makeData(){
        Account a = new Account(
            Name = 'Test Name',
            Industry = 'Agricultural',
            Website = 'https://test.com'
        );
        insert a;
    }

    @isTest
    static void myUnitTest() {
        String sObjectName = 'Account';
        String filters = '{"Website":{"LIKE":"%.com%"}}';
        String referenceField = 'Id';
        Map<String, LunchLookup.ResultProperties> results = LunchLookup.getLookupList(sObjectName, filters, referenceField);
        Assert.isNotNull(results.get('Test Name'));
    }
}