import React from 'react';
import { Document, Page, Text, View, StyleSheet, PDFViewer } from "@react-pdf/renderer";
import { DeliverySchedule } from '@/types/delivery-schedule';

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#fff',
        padding: 20,
        fontSize: 12,
    },
    section: {
        margin: 10,
    },
    title: {
        fontSize: 18,
        fontWeight: 900,
        textAlign: 'center',
        marginBottom: 20,
    },
    subtitle: {
        fontSize: 14,
        marginBottom: 10,
        fontWeight: 'bold',
    },
    table: {
        display: 'flex',
        flexDirection: 'column',
        fontSize: 10,
        borderBottom: 1,
    },
    tableRow: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderLeft: 1,
        borderColor: '#000',
    },
    tableRowHeader: {
        backgroundColor: '#eee',
        borderLeft: 1,
    },
    tableColHeader: {
        width: '25%',
        borderRightWidth: 1,
        padding: 5,
        borderColor: '#000',
        fontWeight: 'bold',
    },
    tableCol: {
        width: '25%',
        borderRightWidth: 1,
        padding: 5,
        borderColor: '#000',
    },
    tableCellHeader: {
        padding: 5,
        fontWeight: 'bold',
    },
    tableCell: {
        padding: 5,
    },
});

// Interface to define the props for the ScheduleReport component
interface ScheduleReportProps {
    // Add prop for delivery schedule
    schedules: DeliverySchedule[];
}


export const ScheduleReport: React.FC<ScheduleReportProps> = (props) => {

    // TODO: Need schedules, store and depot to generate report from objects



    return (
        <PDFViewer style={{ width: '100%', height: '90vh' }}>
            <Document>
                <Page size="A4" style={styles.page}>
                    <Text style={styles.title}>FastTrak Schedule Report</Text>


                    {/* Schedule Overview */}
                    <View style={styles.section}>
                        <Text style={styles.subtitle}>Overview</Text>
                        <Text>Store Name: Store</Text>
                        <Text>Depot Name: Depot</Text>
                        <Text>Delivery Date: 24/03/2024</Text>
                        <Text>Vehicles: 4</Text>
                        <Text>Packages: 5</Text>
                        <Text>Standard Priority: 4</Text>
                        <Text>Express Priority: 2</Text>
                    </View>

                    {/* Schedule Profile */}
                    <View style={styles.section}>
                        <Text style={styles.subtitle}>Schedule Profile</Text>
                        <Text>Auto-Minimise (y/n): Y</Text>
                        <Text>Optimisation Profile: Eco</Text>
                        <Text>Time Window: 8 hours</Text>
                        <Text>Driver Break: 30 minutes</Text>
                        <Text>Estimated Time Per Delivery: 3 minutes</Text>
                    </View>

                    {/* Vehicles Table */}
                    <View style={styles.section}>
                        <Text style={styles.subtitle}>Vehicles</Text>
                        <View style={styles.table}>
                            <View style={[styles.tableRow, styles.tableRowHeader]}>
                                <Text style={styles.tableColHeader}>Number</Text>
                                <Text style={styles.tableColHeader}>Registration</Text>
                                <Text style={styles.tableColHeader}>Load Utilisation (kg)</Text>
                                <Text style={styles.tableColHeader}>Volume (m3)</Text>
                                <Text style={styles.tableColHeader}>Distance (mi)</Text>
                                <Text style={styles.tableColHeader}>Time (hrs)</Text>
                            </View>
                            {/* Row 1 */}
                            <View style={styles.tableRow}>
                                <Text style={styles.tableCol}>1</Text>
                                <Text style={styles.tableCol}>Ab4353e</Text>
                                <Text style={styles.tableCol}>1000/1500 (50%)</Text>
                                <Text style={styles.tableCol}>12/15 (75%)</Text>
                                <Text style={styles.tableCol}>152.3</Text>
                                <Text style={styles.tableCol}>7.34</Text>
                            </View>
                            {/* ... Additional rows would follow the same pattern ... */}
                        </View>
                    </View>

                    {/* ... More sections and tables as required ... */}

                </Page>
            </Document>
        </PDFViewer>
    );
};

