import React from 'react';
import { Document, Page, Text, View, StyleSheet, PDFViewer, Font } from "@react-pdf/renderer";
import { DeliverySchedule } from '@/types/delivery-schedule';
import { Store } from '@/types/store';
import { Depot } from '@/types/depot';
import { PriorityType } from '@/types/package';


const styles = StyleSheet.create({
    page: {
        fontFamily: 'Helvetica',
        flexDirection: 'column',
        backgroundColor: '#fff',
        padding: 20,
        fontSize: 12,
    },
    section: {
        margin: 10,
    },
    header: {
        fontFamily: 'Helvetica-Bold',
        fontSize: 18,
        fontWeight: 600,
        textAlign: 'center',
        marginBottom: 20,

    },
    title: {
        fontFamily: 'Helvetica-Bold',
        fontSize: 16,
        marginBottom: 10,
    },
    subtitle: {
        fontFamily: 'Helvetica-Bold',
        fontSize: 12,
        marginBottom: 5,
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
    tableColThin: {
        width: '15%',
        borderRightWidth: 1,
        padding: 5,
        borderColor: '#000',
    },
    tableColNum: {
        width: '8%',
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
    grid: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    gridBox: {
        width: '33%',
    }
});

interface ScheduleReportProps {
    schedules: DeliverySchedule[];
    store: Store | undefined
    depot: Depot | undefined
}


export const ScheduleReport: React.FC<ScheduleReportProps> = (props) => {

    // TODO: Need schedules, store and depot to generate report from objects

    const totalDrivingTime = props.schedules.reduce((sum, schedule) => sum + schedule.actual_duration_mins, 0).toFixed(2) as unknown as number;
    const totalDistanceMiles = props.schedules.reduce((sum, schedule) => sum + schedule.actual_distance_miles, 0).toFixed(2) as unknown as number;
    const totalLoadWeight = props.schedules.reduce((sum, schedule) => sum + schedule.load_weight, 0).toFixed(2) as unknown as number;
    const totalLoadVolume = props.schedules.reduce((sum, schedule) => sum + schedule.load_volume, 0).toFixed(2) as unknown as number;

    const totalPackages = props.schedules.reduce((sum, schedule) => sum + schedule.num_packages, 0);
    const totalVehicles = props.schedules.reduce((sum, schedule) => schedule.vehicle ? sum + 1 : sum, 0);

    return (
        <>
            {props.schedules && props.store && props.depot &&
                <PDFViewer style={{ width: '100%', height: '90vh' }}>
                    <Document>
                        <Page size="A4" style={styles.page}>
                            <Text style={styles.header}>FastTrak Schedule Report</Text>

                            {/* Overview */}
                            <View style={styles.section}>
                                <Text style={styles.title}>Overview</Text>
                                <Text>Store Name: {props.store.store_name}</Text>
                                <Text>Depot Name: {props.depot.depot_name}</Text>
                                <Text>Delivery Date: {new Date(props.schedules[0].delivery_date).toLocaleDateString('en-GB')}</Text>
                                <Text>Vehicles: {totalVehicles}</Text>
                                <Text>Packages: {totalPackages}</Text>
                                <Text>Standard Priority: {props.schedules.reduce((total, schedule) => total + schedule.package_order.filter(order => order.priority === PriorityType.Standard).length, 0)}</Text>
                                <Text>Standard Priority: {props.schedules.reduce((total, schedule) => total + schedule.package_order.filter(order => order.priority === PriorityType.Express).length, 0)}</Text>
                            </View>

                            {/* Schedule Profile */}
                            <View style={styles.section}>
                                <Text style={styles.title}>Schedule Profile</Text>
                                <Text>Auto-Minimise (Y/N): {props.schedules[0].schedule_report?.auto_minimise ? "Y" : "N"}</Text>
                                <Text>Optimisation Profile: {props.schedules[0].schedule_report?.optimisation_profile}</Text>
                                <Text>Time Window: {props.schedules[0].schedule_report?.time_window_hours} hours</Text>
                                <Text>Estimated Time Per Delivery: {props.schedules[0].schedule_report?.est_delivery_time} minutes</Text>
                            </View>

                            <View style={styles.section}>
                                <Text style={styles.title}>Vehicles</Text>
                                <View style={styles.table}>
                                    <View style={[styles.tableRow, styles.tableRowHeader]}>
                                        <Text style={styles.tableColNum}>#</Text>
                                        <Text style={styles.tableColHeader}>Registration</Text>
                                        <Text style={styles.tableColThin}>Packages</Text>
                                        <Text style={styles.tableColHeader}>Load Utilisation (kg)</Text>
                                        <Text style={styles.tableColHeader}>Volume (m³)</Text>
                                        <Text style={styles.tableColThin}>Distance (mi)</Text>
                                        <Text style={styles.tableColThin}>Time (hrs)</Text>
                                    </View>
                                    {/* Rows */}
                                    {props.schedules.map((schedule, index) =>
                                        schedule.vehicle && (
                                            <View key={index} style={styles.tableRow}>
                                                <Text style={styles.tableColNum}>{index + 1}</Text>
                                                <Text style={styles.tableCol}>{schedule.vehicle.registration}</Text>
                                                <Text style={styles.tableColThin}>{schedule.num_packages}</Text>
                                                <Text style={styles.tableCol}>{`${schedule.load_weight.toFixed(0)}/${schedule.vehicle.max_load.toFixed(0)} (${(schedule.load_weight / schedule.vehicle.max_load * 100).toFixed(0)}%)`}</Text>
                                                <Text style={styles.tableCol}>{`${schedule.load_volume.toFixed(1)}/${schedule.vehicle.max_volume.toFixed(1)} (${(schedule.load_volume / schedule.vehicle.max_volume * 100).toFixed(0)}%)`}</Text>
                                                <Text style={styles.tableColThin}>{schedule.actual_distance_miles.toFixed(1)}</Text>
                                                <Text style={styles.tableColThin}>{(schedule.actual_duration_mins / 60).toFixed(2)}</Text>
                                            </View>
                                        )
                                    )}
                                </View>
                            </View>
                        </Page>
                        <Page size="A4" style={styles.page}>
                            {/* Schedule Profile */}
                            <View style={styles.section}>
                                <Text style={styles.title}>Performance Metrics</Text>
                                <View style={styles.grid}>
                                    <View style={styles.gridBox}>
                                        <Text style={styles.subtitle}>Total Metrics</Text>
                                        <Text>Packages: {props.schedules.reduce((sum, schedule) => schedule.num_packages ? sum + schedule.num_packages : sum, 0)}</Text>
                                        <Text>Driving Time: {totalDrivingTime} hours</Text>
                                        <Text>Distance: {totalDistanceMiles} miles</Text>
                                        <Text>Weight: {totalLoadWeight} kg</Text>
                                        <Text>Volume: {totalLoadVolume} m³</Text>
                                    </View>
                                    <View style={styles.gridBox}>
                                        <Text style={styles.subtitle}>Average Metric Per Vehicle</Text>
                                        <Text>Packages: {(totalPackages / totalVehicles).toFixed(2)}</Text>
                                        <Text>Driving Time: {(totalDrivingTime / totalVehicles).toFixed(2)} hours</Text>
                                        <Text>Distance: {(totalDistanceMiles / totalVehicles).toFixed(2)} miles</Text>
                                        <Text>Weight: {(totalLoadWeight / totalVehicles).toFixed(2)} kg</Text>
                                        <Text>Volume: {(totalLoadVolume / totalVehicles).toFixed(2)} m³</Text>
                                    </View>
                                    <View style={styles.gridBox}>
                                        <Text style={styles.subtitle}>Average Metric Per Package</Text>
                                        <Text>Packages: n/a</Text>
                                        <Text>Driving Time: {(totalDrivingTime / totalPackages).toFixed(2)} hours</Text>
                                        <Text>Distance: {(totalDistanceMiles / totalPackages).toFixed(2)} miles</Text>
                                        <Text>Weight: {(totalLoadWeight / totalPackages).toFixed(2)} kg</Text>
                                        <Text>Volume: {(totalLoadVolume / totalPackages).toFixed(2)} m³</Text>
                                    </View>
                                </View>
                            </View>
                            {/* Schedule Profile */}
                            <View style={styles.section}>
                                <Text style={styles.title}>Schedule Profile</Text>
                                <Text>Auto-Minimise (Y/N): {props.schedules[0].schedule_report?.auto_minimise ? "Y" : "N"}</Text>
                                <Text>Optimisation Profile: {props.schedules[0].schedule_report?.optimisation_profile}</Text>
                                <Text>Time Window: {props.schedules[0].schedule_report?.time_window_hours} hours</Text>
                                <Text>Estimated Time Per Delivery: {props.schedules[0].schedule_report?.est_delivery_time} minutes</Text>
                            </View>

                            <View style={styles.section}>
                                <Text style={styles.title}>Route Efficiency</Text>
                                <Text style={{ marginBottom: 10 }}>Route efficiency (E) is an estimation of how efficiently the routing solution delivers a number of packages. This is theoretical and may 
                                differ in actual results. The efficiency is calculated as:
                                </Text>
                                <Text style={[styles.subtitle, { marginBottom: 10 }]}>Number of Packages / (Driving Time x Distance)</Text>
                                <View style={styles.table}>
                                    <View style={[styles.tableRow, styles.tableRowHeader]}>
                                        <Text style={styles.tableColNum}>#</Text>
                                        <Text style={styles.tableColHeader}>Number of Packages</Text>
                                        <Text style={styles.tableColHeader}>Driving Time (hours)</Text>
                                        <Text style={styles.tableColHeader}>Distance (miles)</Text>
                                        <Text style={styles.tableColHeader}>Efficiency</Text>
                                    </View>
                                    {/* Rows */}
                                    {props.schedules.map((schedule, index) =>
                                        schedule.vehicle && (
                                            <View key={index} style={styles.tableRow}>
                                                <Text style={styles.tableColNum}>{index + 1}</Text>
                                                <Text style={styles.tableCol}>{schedule.num_packages}</Text>
                                                <Text style={styles.tableCol}>{(schedule.actual_duration_mins/60).toFixed(2)}</Text>
                                                <Text style={styles.tableCol}>{(schedule.actual_distance_miles).toFixed(2)}</Text>
                                                <Text style={styles.tableCol}>{(schedule.num_packages / (schedule.actual_distance_miles  * schedule.actual_duration_mins/60)).toFixed(2)}</Text>
                                            </View>
                                        )
                                    )}
                                </View>
                            </View>
                        </Page>

                    </Document>
                </PDFViewer>
            }
        </>

    );
};

