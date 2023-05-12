import { Input, Modal, Select, Tag } from 'antd';
import moment from 'moment';
import React, { Component } from 'react';
// import SignaturePad from 'react-signature-canvas'
import DateTimepicker from '../../../components/FlatFormComponent/Date';
import Datepicker from '../../../components/FlatFormComponent/Date/date_picker';
import Textarealayer from '../../../components/FlatFormComponent/Input/teaxtarea';

import FlatSelect2 from '../../../components/FlatFormComponent/select2/index';
import TimepickerLayer from '../../../components/FlatFormComponent/TimePickerLayer';
import CustomLoader from '../../../components/loader';

import networkList from '../../../constants/networkList';

// import DischargeMedication from '../../lib/discharge_medications';
import bmi_calculator from '../../../constants/bmi_calculator';


import get_unit_info from '../../../constants/get_unit_info';
import postService from '../../../services/httpService';
// import DischargeMedicationTemplate from '../../lib/discharge_medications_template';
import ButtonCheckboxLayer from '../../../components/FlatFormComponent/Input/button_checkbox';
import RadioButtonLayer from '../../../components/FlatFormComponent/Input/radio';
import cstmPrintStyles from '../../../constants/cstmPrintStyles';
import master_config from '../../../constants/master';
import Vitals_layer from '../../../lib/vitals';
import { op_form_schema } from '../../Master/OP-prescription/schema';
import { doctor_default_fields, doctor_prefillDetails, doctor_static_fields } from '../../Emergency/constants';

import { returnCSVitals } from '../../Emergency/Prints/constants';

const { Search } = Input;
const { Option } = Select;
const { base_url, getMasterProcedures, addErSuggestion, updateErSuggestion, deleteErSuggestion, getOpPrescriptionTemplateSections, getErTemplateSections, saveErAssessmentData, viewErAssessmentData, updateErAssessmentData, checkForDuplicateDrug, addOpDrugTemplate, getOpDrugTemplatesList, updateOpDrugTemplate, deleteOpDrugTemplates, updateErInvestigationsTemplate, deleteErInvestigationsTemplates, getSectionWiseOPHistory, addErSuggestionWithAttachments, updateErSuggestionWithAttachments, updateErAssessmentStatus, sendOpPrescriptionWithAttachments, saveCustomProceduresToMaster, getOpPrintSettings, getErTemplatesDropdown, getICDCodes, saveVitals, getPatientVitals } = networkList
const { SECRETARY, ER_DOCTOR, ER_DMO, DOCTOR } = master_config
const PATTERN_DECIMAL_FRACTION = /^(\d+\s*\d*\/?\d*|\d*\.\d+|\d+)$/;
const borderColor = "#e9e9e9";
const vitals_id = "63c157f23d6451635088dbc9";
class CS_Doctor_ERR_Assessment extends Component {
    constructor(props) {
        super(props);
        this.state = {
            loadding: false,
            request_op_prescription_type: null,
            request_op_prescription_disable: null,
            patient_details: {},
            is_suggestion_modal: false,
            opDrugFrequency: "",
            send_whatsapp: false,
            only_print: true, 
            whatsapp_no: false,
            phone_no: null,
            generated_pdf: "",
            refs: [],
            show_header: true,
            selectedData: [],
            selectedData2: [],
            add_drug: false,
            edit_drug: false,
            static_fields: doctor_static_fields,
            default_fields: doctor_default_fields,
            no_abnormality_detected: {
                id: 1,
                parent_id: 1,
                parent_name: "no_abnormality",
                name: "no_abnormality_detected",
                text: "No Abnormality Detected",
                label: "No Abnormality Detected",
                placeholder: "",
                has_free_text: false,
                free_text_placeholder: "",
                errors: [],
            },
            request_op_prescription_schema: [],
            selectedMedications: [],
            icdrelated_searches: [],
            icd_list: [],
            procedures_searches: [],
            procedures_list: [],
            drug_modal: false,
            drug_section_id: null,
            selected_section: null,
            drug_btn_loading: false,
            drug_mode: 'add',
            all_suggestions: [],
            suggestion_modal: null,
            update_prescription_id: null,
            is_print: false,
            is_whatsapp: false,
            patientDetails: {},
            user_data:{},
            drug_templates_list: [],
            selectedMedicationsTemplate: [],
            drug_template_item_mode: 'add',
            create_drug_template_list: [],
            update_drug_template_id: null,
            investigations_templates_list: [],
            investigations_template_type: 'Create',
            investigations_template_modal: false,
            save_as_modal: false,
            templates_modal: false,
            save_as_template_name: null,
            draw_modal: false,
            timer:0,
            draw_mode: null,
            edit_mode: false,
            status: null,
            history_modal: false,
            section_history_res: [],
            form_lock: null,
            form_status: null,
            template_dropdown_schema: {
                id: 1,
                name: 'er_template_dropdown',
                text: 'Select Template',
                visible: true,
                element: 'select2',
                required: true,
                input_type: 'text',
                placeholder: 'Template *',
                icon: 'lock',
                rules: [
                    {
                        test: (value) => {
                            return (value !== null && value.length > 0);
                        },
                        message: 'Please Select Template'
                    }
                ],
                errors: [],
                value: null,
                valid: false,
                state: '',
                disable: false,
                className: ['w-100 form-control']
            },
            selected_op_template: null,
            selected_sketch: null,
            single_drug: false,
            create_custom_investigation_modal: false,
            create_custom_investigation_name: null,
            custom_investigation_from: null,
            all_pdfs: [],
            images: [],
            total_images: 0,
            formSchema: op_form_schema,
            styles: cstmPrintStyles,
            is_stat_buffer: null,
            suggestion_edit_data: {},
            final_vitals: [],
            payload_vitals: [],
            autofill_data: [],
        }
        this.drugScrollRef = React.createRef();
    }

    componentDidMount() {        
        let { patientDetails, page_data } = this.props
        let unit_info = get_unit_info(patientDetails['unit_id'])
        let userData = localStorage.getItem('user_data');
        if (userData !== undefined && userData !== null && userData !== '') {
            userData = JSON.parse(userData);
        }
        this.setState(()=>({ "unit_info": unit_info, "user_data":userData, "patientDetails": patientDetails }))
        this.API_getpatient_vitals()
        this.fetchERtemplate();
        // this.props.leave_page(true)
        let rfs = [];
        ["temperature","pulse","systolic","diastolic","spO2","height","weight", 'bmi'].map((r,i) => {
            let obj={};
            obj["index"] = i;
            obj["name"] = r;
            obj['ref'] = React.createRef();
            rfs.push(obj);
        });
        this.setState({refs: rfs})
    }

    componentWillUnmount() {
        // clearInterval(this.intervel)
    }
    
    API_getpatient_vitals(save_type = "normal") {
        if (save_type != "auto") {
            this.setState({ loadding: true })
        }
        let { patientDetails } = this.props
        try {
            let payload = {
                "data": {
                    "patient_id": patientDetails.id,
                    "unit_id": patientDetails.unit_id,
                    "module_name": ["er"],
                    "form_name": ["triage"]
                }
            }
            postService(getPatientVitals, 'POST', payload).then(res => {
                if (res.status) {
                    console.log(res);
                    const sortedList = res.data.sort((a, b) => {
                        const dateA = new Date(a.observation_time);
                        const dateB = new Date(b.observation_time);
                        return dateA - dateB;
                    });
                    console.log(sortedList);
                    let vitals_list = sortedList && sortedList.length > 0 ? [sortedList[0]] : [];
                    console.log(vitals_list);
                    this.setState({ "final_vitals": vitals_list, "payload_vitals": vitals_list.filter(e=>e["access_type"] !== "view") }, ()=>{
                        this.API_getpatient_vitals_current_page();
                    })
                } else {
                    this.setState({ loadding: false })
                    Modal.error({
                        title: 'Failure',
                        content: res.message ? res.message : 'Oops! something is wrong. Please try again.',
                    })
                }
            })
        } catch (error) {
            console.log(error);
            this.setState((state) => ({ loadding: false }));

            Modal.error({
                title: 'Failure',
                content: 'Oops, something is wrong. Please try again.',
            })
        }
    }
    API_getpatient_vitals_current_page(save_type = "normal") {
        if (save_type != "auto") {
            this.setState({ loadding: true })
        }
        let { patientDetails } = this.props;
        let { final_vitals } = this.state;
        try {
            let payload = {
                "data": {
                    "patient_id": patientDetails.id,
                    "unit_id": patientDetails.unit_id,
                    "module_name": ["er"],
                    "form_name": ["doctor-er-assessment"]
                }
            }
            postService(getPatientVitals, 'POST', payload).then(res => {
                if (res.status) {
                    console.log(res);
                    const sortedList = res.data.sort((a, b) => {
                        const dateA = new Date(a.observation_time);
                        const dateB = new Date(b.observation_time);
                        return dateA - dateB;
                    });
                    console.log(final_vitals, sortedList);
                    let vitals_list = final_vitals;
                    if(sortedList && sortedList.length > 0){
                        vitals_list.push(sortedList[0])
                    }
                    this.setState({ "final_vitals": vitals_list, "payload_vitals": vitals_list?.filter(e=>e["access_type"] !== "view") })
                } else {
                    this.setState({ loadding: false })
                    Modal.error({
                        title: 'Failure',
                        content: res.message ? res.message : 'Oops! something is wrong. Please try again.',
                    })
                }
            })
        } catch (error) {
            console.log(error);
            this.setState((state) => ({ loadding: false }));

            Modal.error({
                title: 'Failure',
                content: 'Oops, something is wrong. Please try again.',
            })
        }
    }
    API_viewprescriptiondata(save_type="normal") {
        if(save_type != "auto"){
            this.setState({ loadding: true })
        }
        // let detail = localStorage.getItem('op_patient_details')
        // let details = JSON.parse(detail)
        let userData = localStorage.getItem('user_data');
        if (userData !== undefined && userData !== null && userData !== '') {
            userData = JSON.parse(userData);
        }
        let { patientDetails } = this.props
        let { template_dropdown_schema, selected_op_template, whatsapp_form_schema} = this.state;
        try {
            let payload = {
                "data": {
                    "umr_no": patientDetails.umr_no,
                    "patient_id": patientDetails.patient_id,
                    "unit_id": userData && userData['unit_id'] ? userData['unit_id'] : null,
                }
            }
            postService(viewErAssessmentData, 'POST', payload).then(res => {
                if (res.status) {
                    if (res['data'] && res['data'].length > 0) {
                        this.props.verify_data(true)
                        template_dropdown_schema.value = res['data'][0]['template_id'];
                        this.setState({template_dropdown_schema: template_dropdown_schema, selected_op_template: res['data'][0]['template_id']});                           
                        this.setState((state) => ({
                            update_prescription_id: res['data'][0]['_id']
                            // loadding: false,
                        }));
                        // button level permissions
                        let status = null
                        if(res['data'][0]["is_locked"] && res['data'][0]["is_locked"] == "yes"){
                            status = null
                        }else{
                            status = "full_edit";
                        }
                        let pres_data = res['data'][0]['er_assessment'];
                        pres_data.map(e=>{
                            if(e['sketch_list'] && e['sketch_list'].length > 0){
                                e['sketch_list'].map((sketch, ind)=>{
                                    sketch["is_active"] = ind == 0;
                                })
                            }
                        })
                        // whatsapp_form_schema.map(feild=>{
                        //     if(feild.name=="whatsapp_no"){
                        //         feild.value = parseInt(patientDetails.mobile_no);
                        //         this.setState({whatsapp_no: Boolean(patientDetails.mobile_no), phone_no: parseInt(patientDetails.mobile_no)});
                        //     }
                        // })
                        this.setState({"status": status,"form_status":res['data'][0]["approval_status"] == undefined ? null : res['data'][0]["approval_status"], whatsapp_form_schema: whatsapp_form_schema},()=>{
                            this.fetchoptemplate('view', pres_data, res['data'][0]["approval_status"] == undefined ? null : res['data'][0]["approval_status"], save_type);
                        })
                    } else {
                        this.props.verify_data(false)
                        this.fetchoptemplate()
                        // this.setState((state) => ({                        
                        //     loadding: false,
                        // }));
                    }
                } else {
                    this.setState({ loadding: false })
                    Modal.error({
                        title: 'Failure',
                        content: res.message ? res.message : 'Oops! something is wrong. Please try again.',
                    })
                }
            })
        } catch (error) {
            console.log(error);
            this.setState((state) => ({ loadding: false }));

            Modal.error({
                title: 'Failure',
                content: 'Oops, something is wrong. Please try again.',
            })
        }
    }
    
    fetchoptemplate(mode, view_data, form_status, save_type="normal") {
        if(save_type != "auto"){
            this.setState({ loadding: true })
        }
        let {user_data, final_vitals, selected_op_template, template_dropdown_schema, status, static_fields, default_fields, autofill_data}=this.state;
        let {patientDetails} = this.props;
        let is_female = patientDetails.gender.toLowerCase() == "female";
        try {
            let payload = {
                "data": { 
                    "doctor_id": patientDetails.doctor_id,
                    "unit_id": patientDetails.unit_id,
                    "template_id": selected_op_template 
                }
            }
            postService(getErTemplateSections, 'POST', payload).then(res => {
                if (res.status) {
                    if (res['data']) {
                        let all_fields = [
                            ...res["data"]["section_details"],
                          ];
                        all_fields.map(section=>{
                            let default_section = default_fields.find(ds => ds.section_id==section.section_id);
                            let static_section = static_fields.find(ds => ds.section_id==section.section_id);
                            if(default_section){
                                section["fields"] = default_section["fields"];
                            } else if(section.section_id == "63bd5618939bc88664d7161e"){
                                section["fields"] = [...static_section["fields"], ...section["fields"]];
                            } else if(static_section){
                                section["fields"] = static_section["fields"];
                            }
                        })
                        all_fields = [...doctor_prefillDetails(view_data, all_fields)];
                        if (mode) {
                            all_fields.map((master_sections, mkey) => {
                                master_sections['fields'].map((fdata, fkey) => {
                                    if(fdata.visible && fdata.element!="upload_file"){
                                        if(fdata["element"] === "group"){
                                            fdata.sub_fields.map((sub_field, sub_key)=>{
                                                if(sub_field.visible){
                                                    let obj = view_data?.find(e => (e.section_id == master_sections['section_id'] && e.field_id == sub_field.id))
                                                    all_fields[mkey]['fields'][fkey]['sub_fields'][sub_key]['value'] = obj && obj['field_value'] ? obj['field_value'] : null
                                                    all_fields[mkey]['fields'][fkey]['sub_fields'][sub_key]['text'] = obj && obj['field_text'] ? obj['field_text'] : null
                                                    all_fields[mkey]['fields'][fkey]['sub_fields'][sub_key]['disable'] = true
                                                    // all_fields[mkey]['fields'][fkey]['text'] = obj && obj['field_text'] ? obj['field_text'] : null
                                                    // all_fields[mkey]['icd_list'] = obj && obj['icd_list'] ? obj['icd_list'] : []
                                                    // all_fields[mkey]['procedures_list'] = obj && obj['procedures_list'] ? obj['procedures_list'] : []
                                                    all_fields[mkey]['fields'][fkey]['sub_fields'][sub_key]['sketch_list'] = obj && obj['sketch_list'] && obj['sketch_list'].length > 0 ? obj['sketch_list'] : null
                                                    all_fields[mkey]['mode'] = "view"
                                                    all_fields[mkey]['disable'] = true
                                                    // all_fields[mkey]['attachments'] = obj && obj['attachments'] ? obj['attachments'] : []
                                                    all_fields[mkey]['is_data'] = obj && ((obj['field_value']?.length>0) || obj['procedures_list']?.length>0 || obj['icd_list']?.length>0 || obj['attachments']?.length>0) ? true : false
                                                    if(sub_field["element"] == "radio" && obj){
                                                        sub_field["options"] &&
                                                            sub_field["options"].map((option_data, okey) => {
                                                                sub_field["options"][okey]["value"] = null;
                                                                sub_field["options"][okey]["free_text_value"] = null;
                                                                sub_field["options"][okey]["other_comments"] = null;
                                                                if (
                                                                    obj["field_value"] && option_data["label"] == obj["field_value"]
                                                                ) {
                                                                    sub_field["options"][okey]["value"] = obj["field_value"];
                                                                    sub_field["options"][okey]["free_text_value"] = obj["free_text_value"];
                                                                    sub_field["options"][okey]["other_comments"] = obj["other_comments"];
                                                                    sub_field["free_text_value"] = obj["free_text_value"];
                                                                    sub_field["other_comments"] = obj["other_comments"];
                                                                }
                                                            });
                                                    }
                                                    if(sub_field['element'] == 'button_checkbox' && obj?.options && obj.options.length > 0){
                                                        sub_field.options.map(option=>{
                                                            let currOpt = obj["options"].find(opt=> opt.name == option.name);
                                                            option.checked = currOpt?.checked
                                                            option.free_text_value = currOpt?.free_text_value;
                                                            option.value = currOpt?.value;
                                                        })
                                                    }
                                                    if(sub_field['element'] == 'ckeditor'){
                                                        all_fields[mkey]['fields'][fkey]['sub_fields'][sub_key]['disable'] = true || obj && obj['disable']
                                                        all_fields[mkey]['fields'][fkey]['sub_fields'][sub_key]['required'] = obj && obj['required'] ? true : false
                                                        all_fields[mkey]['required'] = obj && obj['required'] ? true : false
                                                    }
                                                }
                                            })
                                        } else if (fdata['name'] == "vitals") {
                                            let obj = view_data?.find(e => (e.section_id == master_sections['section_id'] && e.field_id == fdata.id))
                                            // fdata['sub_fields'][0]['value'] = obj['field_value'][0]
                                            // fdata['sub_fields'][1]['value'] = obj['field_value'][1]
                                            all_fields[mkey]['fields'][fkey]['text'] = obj && obj['field_text'] ? obj['field_text'] : null
                                            // all_fields[mkey]['fields'][fkey]['text'] = obj && obj['field_text'] ? obj['field_text'] : null
                                            // all_fields[mkey]['icd_list'] = obj && obj['icd_list'] ? obj['icd_list'] : []
                                            // all_fields[mkey]['procedures_list'] = obj && obj['procedures_list'] ? obj['procedures_list'] : []
                                            all_fields[mkey]['mode'] = "view"
                                            all_fields[mkey]['disable'] = true
                                            // fdata['sub_fields'][0]['disable'] = form_lock
                                            // fdata['sub_fields'][1]['disable'] = form_lock
                                            console.log(final_vitals);
                                            all_fields[mkey]['fields'][fkey]['value'] = final_vitals || []
                                            all_fields[mkey]['is_data'] = view_data?.find(e => (e.section_id == master_sections['section_id'])) ? true : false
                                        } else {
                                            let obj = view_data?.find(e => (e.section_id == master_sections['section_id'] && e.field_id == fdata.id))
                                            let value = obj && obj['field_value'] ? obj['field_value'] : null
                                            if(fdata["element"] == "datetime" && value){
                                                value = moment(value, 'YYYY-MM-DD HH:mm').format('DD-MM-YYYY HH:mm');
                                            }
                                            all_fields[mkey]['fields'][fkey]['value'] = value;
                                            all_fields[mkey]['fields'][fkey]['text'] = obj && obj['field_text'] ? obj['field_text'] : null
                                            all_fields[mkey]['fields'][fkey]['disable'] = true
                                            // all_fields[mkey]['fields'][fkey]['text'] = obj && obj['field_text'] ? obj['field_text'] : null
                                            all_fields[mkey]['icd_list'] = obj && obj['icd_list'] ? obj['icd_list'] : []
                                            all_fields[mkey]['procedures_list'] = obj && obj['procedures_list'] ? obj['procedures_list'] : []
                                            all_fields[mkey]['sketch_list'] = obj && obj['sketch_list'] && obj['sketch_list'].length > 0 ? obj['sketch_list'] : null
                                            all_fields[mkey]['mode'] = "view"
                                            all_fields[mkey]['disable'] = true
                                            all_fields[mkey]['attachments'] = (obj && obj['attachments']) ? obj['attachments'] : []
                                            all_fields[mkey]['is_data'] = obj && ((obj['field_value']?.length>0) || obj['procedures_list']?.length>0 || obj['icd_list']?.length>0 || obj['attachments']?.length>0) ? true : false
                                            if(master_sections['section_name'] == "Review"){
                                                all_fields[mkey]['followup_value'] = obj && obj['followup_value'] ? obj['followup_value'] : null
                                                all_fields[mkey]['followup_date'] = obj && obj['followup_date'] ? obj['followup_date'] : null
                                                all_fields[mkey]['surgery_date'] = obj && obj['surgery_date'] ? obj['surgery_date'] : null
                                                all_fields[mkey]['surgery_checked'] = obj && obj['surgery_checked'] ? obj['surgery_checked'] : null
                                                all_fields[mkey]['procedure_date'] = obj && obj['procedure_date'] ? obj['procedure_date'] : null
                                                all_fields[mkey]['procedure_checked'] = obj && obj['procedure_checked'] ? obj['procedure_checked'] : null
                                                all_fields[mkey]['admission_date'] = obj && obj['admission_date'] ? obj['admission_date'] : null
                                                all_fields[mkey]['admission_checked'] = obj && obj['admission_checked'] ? obj['admission_checked'] : null
                                                all_fields[mkey]['is_data'] = obj && (obj["followup_date"]?.length>0) ? true : false
                                            }
                                            if(fdata["element"] == "radio" && obj){
                                                fdata["options"] &&
                                                    fdata["options"].map((option_data, okey) => {
                                                        fdata["options"][okey]["value"] = null;
                                                        fdata["options"][okey]["free_text_value"] = null;
                                                        fdata["options"][okey]["other_comments"] = null;
                                                        if (
                                                            obj["field_value"] && option_data["label"] == obj["field_value"]
                                                        ) {
                                                            fdata["options"][okey]["value"] = obj["field_value"];
                                                            fdata["options"][okey]["free_text_value"] = obj["free_text_value"];
                                                            fdata["options"][okey]["other_comments"] = obj["other_comments"];
                                                            fdata["free_text_value"] = obj["free_text_value"];
                                                            fdata["other_comments"] = obj["other_comments"];
                                                        }
                                                    });
                                            }
                                            if(fdata['element'] == 'button_checkbox' && obj?.options && obj.options.length > 0){
                                                all_fields[mkey]['is_data'] = obj["options"].find(opt=> opt.checked == true);
                                                fdata.options.map(option=>{
                                                    let currOpt = obj["options"].find(opt=> opt.name == option.name);
                                                    option.checked = currOpt?.checked
                                                    option.free_text_value = currOpt?.free_text_value;
                                                    option.value = currOpt?.value;
                                                })
                                            }
                                            if(fdata['element'] == 'ckeditor'){
                                                all_fields[mkey]['fields'][fkey]['disable'] = true || obj && obj['disable']
                                                all_fields[mkey]['fields'][fkey]['required'] = obj && obj['required'] ? true : false
                                                all_fields[mkey]['required'] = obj && obj['required'] ? true : false
                                            }
                                        }
                                    }
                                })
                                
                                if (master_sections['section_id'] == "63c3add3281d713866a1facb") {
                                    master_sections["visible"] = ((user_data['role_id'] == SECRETARY && form_status!=1)) ? false : is_female;
                                }else{
                                    all_fields[mkey]['visible'] = ((user_data['role_id'] == SECRETARY && form_status!=1) && master_sections['section_id'] !== vitals_id) ? false : true
                                }
                                // all_fields[mkey]['visible'] = true
                            })
                            all_fields = [...this.prefillPatientDetails(view_data, all_fields)];
                            // console.log(all_fields);
                            this.setState((state) => ({
                                request_op_prescription_schema: all_fields,
                                loadding: false,
                            }));
                        } else {

                        all_fields.map((master_sections, mkey) => {
                            all_fields[mkey]['mode'] = "add"
                            all_fields[mkey]['followup_value'] = "1w"
                            all_fields[mkey]['followup_date'] = moment().add(1, "w").format('YYYY-MM-DD')
                            if (master_sections['section_id'] == "63c3add3281d713866a1facb") {
                                master_sections["visible"] = ((user_data['role_id'] == SECRETARY && form_status!=1)) ? false : is_female;
                            }else{
                                all_fields[mkey]['visible'] = ((user_data['role_id'] == SECRETARY && form_status!=1) && master_sections['section_id'] !== vitals_id) ? false : true
                            }
                            master_sections['fields'].map((fdata, fkey) => {
                                if (fdata['name'] == "vitals") {
                                    let obj = autofill_data?.find(e => (e.section_id == master_sections['section_id'] && e.field_id == fdata.id))
                                    all_fields[mkey]['fields'][fkey]['value'] = final_vitals || []
                                    all_fields[mkey]['fields'][fkey]['text'] = obj && obj['field_text'] ? obj['field_text'] : null                                    
                                } 
                            })
                            // all_fields[mkey]['visible'] = true
                            // all_fields[mkey]['fields'][0]['visible'] = (user_data['role_id'] == SECRETARY && master_sections['section_id'] !== "v123456") ? false : true
                        })
                        all_fields = [...this.prefillPatientDetails(view_data, all_fields)];
                        this.setState((state) => ({
                            request_op_prescription_schema: all_fields,
                            // master_request_op_prescription_schema: res['data'],
                            loadding: false,
                        }));}
                        template_dropdown_schema.value = res['data']['_id'];
                        this.setState({template_dropdown_schema: template_dropdown_schema, selected_op_template: res['data']['_id']});
                    } else {
                        this.setState((state) => ({
                            request_op_prescription_schema: [],
                            loadding: false,
                        }));
                    }
                } else {
                    this.setState({ loadding: false })
                    Modal.error({
                        title: 'Failure',
                        content: res.message ? res.message : 'Oops! something is wrong. Please try again.',
                    })
                }
            })
        } catch (error) {
            console.log(error);
            this.setState((state) => ({ loadding: false }));

            Modal.error({
                title: 'Failure',
                content: 'Oops, something is wrong. Please try again.',
            })
        }
    }
    fetchERtemplate(mode, view_data, form_lock, save_type="normal") {
        if(save_type != "auto"){
            this.setState({ loadding: true })
        }
        let {user_data, selected_op_template, template_dropdown_schema, status}=this.state;
        let {patientDetails} = this.props;
        try {
            let payload = {
                "data": { 
                    "doctor_id": patientDetails.doctor_code,
                }
            }
            postService(getErTemplatesDropdown, 'POST', payload).then(res => {
                if (res.status) {
                    if (res["data"] && res["data"].length > 0) {
                        let temp = res["data"].find(t => t["template_type"] == "Doctor");
                        this.setState((state) => ({
                            loadding: false,
                            selected_op_template: temp['_id'] || res['data'][0]['_id']
                        }),()=>{
                            this.API_viewprescriptiondata();
                        });
                     } else {
                        this.setState((state) => ({
                            selected_op_template: null,
                            loadding: false,
                        }));
                    }
                } else {
                    this.setState({ loadding: false })
                    Modal.error({
                        title: 'Failure',
                        content: res.message ? res.message : 'Oops! something is wrong. Please try again.',
                    })
                }
            })
        } catch (error) {
            console.log(error);
            this.setState((state) => ({ loadding: false }));

            Modal.error({
                title: 'Failure',
                content: 'Oops, something is wrong. Please try again.',
            })
        }
    }

    prefillPatientDetails=(data, schema)=>{
        let { patientDetails } = this.props;
        let { form_status } = this.state;
        let height = data?.find(d => d.section_id == vitals_id && d.field_name == "height")?.field_value;
        let weight = data?.find(d => d.section_id == vitals_id && d.field_name == "weight")?.field_value;
        let bmi = data?.find(d => d.section_id == vitals_id && d.field_name == "bmi")?.field_value;
        let sourceOfPreviousMedicationApplicable;
        schema.map((section, skey) => {
            // arrival details
            if (section['section_id'] == "63c15bc53d6451635088dd93") {
                section['fields'].map((feild, fkey) => {
                    if (feild.name == "arrival_date") {
                        feild.value = moment(patientDetails["arrival_datetime"]).format("DD-MM-YYYY HH:mm");
                    }
                    if (["mode_of_arrival", "referred_from", "previous_admission"].includes(feild.name)) {
                        let obj = {"previous_admission": "previous_ip_no", "referred_from": "referred_from_value"}
                        feild.value = patientDetails[feild.name];
                        feild["options"] &&
                            feild["options"].map((option_data, okey) => {
                                feild["options"][okey]["value"] = null;
                                feild["options"][okey]["free_text_value"] = null;
                                feild["options"][okey]["other_comments"] = null;
                                if (
                                    option_data["label"] == patientDetails[feild.name] &&
                                    option_data["parent_name"] == feild.name
                                ) {
                                    feild["options"][okey]["value"] = patientDetails[feild.name];
                                    if(obj[feild.name]){
                                        feild["options"][okey]["free_text_value"] = patientDetails[obj[feild.name]];
                                        feild["free_text_value"] = patientDetails[obj[feild.name]];
                                    }
                                }
                            });
                    }
                })
            }
            // nutritional screening
            // if (section['section_id'] == "63c15c6a3d6451635088ddd5") {
            //     console.log(section['fields'], height, weight, bmi);
            //     section['fields'].map((feild, fkey) => {
            //         if(feild.element === "group"){
            //             feild.sub_fields.map((sub_feild)=>{
            //                 if (sub_feild.name == "height") {
            //                     sub_feild.value = height;
            //                     console.log(sub_feild.value, height);
            //                 }
            //                 if (sub_feild.name == "weight") {
            //                     sub_feild.value = weight;
            //                 }
            //                 if (sub_feild.name == "bmi") {
            //                     sub_feild.value = bmi;
            //                 }
            //             });
            //         }
            //     })
            // }
            if (section['section_id'] == "63bd5618939bc88664d7161e") {
                section['fields'].map((feild, fkey) => {
                    if (feild.id == 3 && feild.name == "sourceOfPreviousMedicationApplicable") {
                        sourceOfPreviousMedicationApplicable = feild.options.filter(option => option.checked)?.length > 0;
                    }
                })
            }
            section.fields.map(field =>{
                if(field.element == "ckeditor"){
                    field.disable = field["disable"] || true;
                    section.required = !field["disable"];
                }
                if(field.element == "input"){
                    field.disable = field["disable_always"] || true;
                }
                if(field.element == "radio" || field.element == "button_checkbox"){
                    field.options.map(option=>{
                        option.disable = option["disable_always"] || true
                    })
                }
                if(field.element === "group"){
                    field.sub_fields.map((sub_feild)=>{
                        if(sub_feild.element == "input"){
                            sub_feild.disable = sub_feild["disable_always"] || true;
                        }
                        if(sub_feild.element == "radio" || sub_feild.element == "button_checkbox"){
                            sub_feild.options.map(option=>{
                                option.disable = option["disable_always"] || true
                            })
                        }
                    })
                }
            })
        })
        schema.map((section, skey) => {
            // medical reconcilation
            if (section['section_id'] == "63bd5618939bc88664d7161e") {
                section['fields'].map((feild, fkey) => {
                    if(feild.id == 1 || feild.id == 2){
                        feild.visible = !sourceOfPreviousMedicationApplicable;
                    }
                })
            }
        })
        return schema;
    }

    returnImages=(section)=>{
        return <div className='col-12 d-flex'>
            <div className='col-12'>
                {section['sketch_list'] && section['sketch_list'].length > 0 && section['sketch_list'].map(e=>{
                    return <div className='col-12 p-0 mb-2' key={e["id"]}>
                        <img src={e['img_url']} className="w-100 mt-1"></img>
                    </div>
                })}
            </div>
        </div>
    }

    render() {
        let { edit_drug, add_drug, selectedData, selectedData2, send_whatsapp, no_abnormality_detected, templates_modal, show_header, only_print, whatsapp_no, loadding, request_op_prescription_schema, whatsapp_form_schema, icdrelated_searches, icd_list, procedures_searches, drug_modal, selected_section, create_drug, drug_mode, is_suggestion_modal, create_suggestion_form, suggestion_modal, update_prescription_id, patientDetails, unit_info, is_print, is_whatsapp, user_data, followup_date, drug_template_modal, drug_selected_template_name, drug_template_type, create_template_name, create_drug_template_list, drug_template_item_mode, investigations_template_modal, investigations_template_type, create_investigations_schema, save_as_modal, save_as_template_name, draw_modal, draw_mode, edit_mode, status, history_modal, form_status, template_dropdown_schema, selected_sketch, opDrugFrequency, add_more_form_data, create_custom_investigation_modal, create_custom_investigation_name, images, styles, suggestion_edit_data, suggestion_investigations_edit_data } = this.state
        return (<React.Fragment>
            {loadding && <CustomLoader />}
            <div className='' style={{zIndex:0}}>
                <div className='clearfix'>
                    <div className='float-left'><h1 className="text-p-bold font-weight-bold text-left text-uppercase">Doctor ER Assessment</h1></div>
                    {/* <div className='float-right'><p className="text-p-bold font-weight-bold text-uppercase">KIMS{unit_info ? '-'+unit_info['unit_code'] : null }</p></div> */}
                </div>
                <div className='p-3' style={{minHeight:'200px'}}>
                    {/* <Patient_details patientDetails={patientDetails}/> */}
                    {request_op_prescription_schema.sort((a, b) => ((a?.order != null) - (b?.order != null) || a?.order - b?.order)).map((section, skey) => {
                        if(section['visible']){
                            let is_drugsection = section?.['has_field']?.filter(e=>e=='drugs').length>0;
                            return <span>
                                <div className='d-flex pt-2 pb-1'>
                                    <div className='mr-auto my-auto' ref={is_drugsection && this.drugScrollRef}><h1 className='fs-6 text-capitalize font-weight-bold'>{section['alt_heading'] || section['section_name']}</h1></div>
                                </div>
                                {section["sub_text"] && <p className='w-100 pb-2'>{section["sub_text"]}</p>}
                                <div className='row flat-design pl-4'>
                                    {section['fields']?.map((feild, fkey) => {
                                        if (feild['visible'] && feild['element'] == 'vitals') {
                                            return returnCSVitals(feild);
                                        }
                                      
                                      
                                        if (feild['visible'] && feild['element'] == 'drugs') {
                                            // let new_selected_list = feild['value']?.reduce((current, obj) => {
                                            //     let is_exists = current.find(data => data['index'] === obj['index'])
                                            //     if (is_exists && is_exists['index']) {
                                            //         current.map((data, key) => {
                                            //             if (data['index'] === obj['index']) {
                                            //                 current[key][obj['name']] = {
                                            //                     'value': obj['value'],
                                            //                     'text': obj['text'],
                                            //                     'dec': obj['dec']
                                            //                 };
                                            //                 if (obj["frequcncy_type"] != null && obj["frequcncy_type"] != undefined) {
                                            //                     current[key][obj['name']] = { ...current[key][obj['name']], "frequcncy_type": obj["frequcncy_type"] }
                                            //                 }
                                            //             }
                                            //         })
                                            //         return current;
                                            //     } else {
                                            //         let new_obj = {}
                                            //         new_obj['index'] = obj['index'];
                                            //         new_obj[obj['name']] = {
                                            //             'value': obj['value'],
                                            //             'text': obj['text'],
                                            //             'dec': obj['dec']
                                            //         };
                                            //         if (obj["frequcncy_type"] != null && obj["frequcncy_type"] != undefined) {
                                            //             new_obj[obj['name']] = { ...new_obj[obj['name']], "frequcncy_type": obj["frequcncy_type"] }
                                            //         }
                                            //         return current.concat([new_obj])
                                            //     }
                                            // }, [])
                                            let variables = false
                                            feild["value"] && feild["value"].map((vari,key)=>{if(vari['variables_data']?.length>0){return variables = true}})
                                            
                                            return <>
                                                <div className='px-3 table-responsive'>
                                                    <table className='table table-bordered'>
                                                        <thead className='bg-light'>
                                                            <tr>
                                                                <td className='p-1'><h6 style={{ fontSize: '10.5pt', fontWeight: '600' }}>Name</h6></td>
                                                                <td className='p-1'><h6 style={{ fontSize: '10.5pt', fontWeight: '600' }}>Frequency - Units</h6></td>
                                                                <td className='p-1'><h6 style={{ fontSize: '10.5pt', fontWeight: '600' }}>Route</h6></td>
                                                                {/* <td className='p-1'><h6 style={{ fontSize: '10.5pt', fontWeight: '600' }}>Duration</h6></td> */}
                                                                <td className='p-1'><h6 style={{ fontSize: '10.5pt', fontWeight: '600' }}>Instructions</h6></td>
                                                                <td className='p-1'><h6 style={{ fontSize: '10.5pt', fontWeight: '600' }}>Last taken at</h6></td>
                                                                <td className='p-1'><h6 style={{ fontSize: '10.5pt', fontWeight: '600' }}>To be continued</h6></td>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {feild["value"]?.map((drug, dkey) => {
                                                                return <>
                                                                    <tr key={dkey + 1}>
                                                                        <td className='p-1 pointer' onClick={() => { }}><p className='text-bold'>{drug['drug_name'] ? drug['drug_name'] : '--'}</p></td>
                                                                        <td>{drug["frequcncy_text"] || "--"} - {drug["planned_doses"].map((times, tkey) => { return <>{times["planned_dose"]} {drug["dose_units"]} at {moment(times["planned_time"],"HH:mm").format("hh:mm A")}{drug["planned_doses"].length !== (tkey+1) && ', '} </> })}</td>                                                                      
                                                                        <td>{drug["route_name"] || "--"}</td>   
                                                                        {/* <td>{drug["days"] || "--"} days</td> */}
                                                                        <td>{drug["taken_with"]} {drug["instructions"]}</td>                                                                                                                                           
                                                                        <td>{drug["last_taken_at"] || "--"}</td>                                                                      
                                                                        <td>{drug["continued"] || "--"}</td> 
                                                                    </tr>
                                                                    <tr>
                                                                        <td className='p-1' colSpan={10}><small className='font-italic'>{drug['drug_dec'] ? drug['drug_dec'] : '--'}</small></td>
                                                                    </tr>
                                                                </>
                                                            })}                                                            
                                                        </tbody>
                                                    </table>
                                                </div>
                                                {feild.errors.map((error, eKey) => {
                                                    return (
                                                        <small
                                                        key={eKey}
                                                        className="text-danger animated flash"
                                                        >
                                                        {error.message}
                                                        </small>
                                                    );
                                                })}
                                                {/* <button className="btn custom-btn mx-auto" onClick={() => { this.setState({ "drug_modal": true, "drug_section_id": section['section_id'] }) }}><i className="fas fa-plus btn-icon"></i>Add/Remove Drugs</button> */}
                                            </>
                                        }
                                        if (feild.visible && feild.element === "radio") {
                                            return (
                                                <>
                                                <div className={feild.className}>
                                                    <div className={feild.feild_className}>
                                                        <p className={`flat-label text-capitalize mb-0 ${feild.label_className}`}>
                                                        {feild["label"]}
                                                        </p>
                                                        {feild["options"].map((option, pkey) => {
                                                            return (
                                                                <label
                                                                    htmlFor={option.parent_name + option.id}
                                                                    className={`text-capitalize mr-1 ${feild.value && (option.value == feild.value) ? "checked" : ""} ${option.disable ? "disable" : ""}`}
                                                                >
                                                                    {option.label}
                                                                </label>
                                                            );
                                                        })}
                                                        {feild.errors.map((error, eKey) => {
                                                            return (
                                                                <small
                                                                key={eKey}
                                                                className="text-danger animated flash"
                                                                >
                                                                {error.message}
                                                                </small>
                                                            );
                                                        })}
                                                        {feild["img"] && <img src={feild["img"][feild.value]} style={{ width: "100%"}}/>}
                                                    </div>
                                                </div>
                                                {section['attachments']?.length > 0 && <div className='p-3 d-flex flex-wrap'>
                                                    {section['attachments'].map((item, item_key) => {
                                                        return <div className='col-12'>                                                            
                                                            {(item['file_type'] !== "pdf") && <img alt="image" src={base_url + item['folder_path']} style={{width:'100%'}}></img>}
                                                        </div>
                                                    })}
                                                </div>}
                                                </>
                                            );
                                        }
                                        if (feild.visible && feild.element === "button_checkbox") {
                                            return (
                                                <div className={feild.className}>
                                                <div className={feild.feild_className}>
                                                    <p className={`flat-label text-capitalize mb-0 ${feild.label_className}`}>
                                                    {feild["label"]}
                                                    </p>
                                                    {feild["options"].map((option, pkey) => {
                                                        return (
                                                            <ButtonCheckboxLayer
                                                                selectdata={option}
                                                                {...this.props}
                                                                {...this.state}
                                                                onselectChanges={(e) => {
                                                                    
                                                                }}
                                                                />
                                                            );
                                                        })}
                                                        {feild.errors.map((error, eKey) => {
                                                            return (
                                                                <small
                                                                key={eKey}
                                                                className="text-danger animated flash"
                                                                >
                                                                    {error.message}
                                                                </small>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        }
                                        if (feild.element == "group"){
                                            return <>
                                                <p className={`col-lg-12 flat-label text-capitalize mb-0 ${feild.label_className}`}>{feild["label"]}</p>
                                                <div className={feild.className}>
                                                    {feild.sub_fields.map((sub_feild)=>{
                                                        if (sub_feild.visible && sub_feild.element === "text"){
                                                            return <div className={sub_feild.className}>
                                                                <div className={sub_feild.feild_className}>
                                                                    <p className="flat-label text-bold text-capitalize mb-0" onClick={()=>{
                                                                        if(sub_feild["ref"] && sub_feild["ref"]=="drugScrollRef"){
                                                                            this.drugScrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
                                                                        }
                                                                    }}>
                                                                        {sub_feild["label"]}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        }
                                                        if (sub_feild.visible && sub_feild.element === "button_checkbox") {
                                                            return (
                                                                <div className={sub_feild.className}>
                                                                <div className={sub_feild.feild_className}>
                                                                    <p className="flat-label text-capitalize mb-0">
                                                                    {sub_feild["label"]}
                                                                    </p>
                                                                    {sub_feild["options"].map((option, pkey) => {
                                                                        return (
                                                                            <ButtonCheckboxLayer
                                                                                selectdata={option}
                                                                                {...this.props}
                                                                                {...this.state}
                                                                                onselectChanges={(e) => {
                                                                                    
                                                                                }}
                                                                                />
                                                                            );
                                                                        })}
                                                                        {sub_feild.errors.map((error, eKey) => {
                                                                            return (
                                                                                <small
                                                                                key={eKey}
                                                                                className="text-danger animated flash"
                                                                                >
                                                                                    {error.message}
                                                                                </small>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            );
                                                        }
                                                        if (sub_feild.visible && sub_feild.element == 'input') {
                                                            return <div className="mr-4" key={sub_feild.id} style={{paddingLeft:"15px"}}>
                                                                <p className="flat-label text-bold text-capitalize" dangerouslySetInnerHTML={{__html: sub_feild["label"]}}></p>
                                                                <p dangerouslySetInnerHTML={{__html: sub_feild["value"]}}></p>
                                                            </div>
                                                        }
                                                        if (sub_feild.visible && sub_feild.element === "radio") {
                                                            // console.log(sub_feild);
                                                            return (
                                                                <div className={sub_feild.className}>
                                                                    <div className={sub_feild.feild_className}>
                                                                        <p className="flat-label text-capitalize mb-0">
                                                                        {sub_feild["label"]}
                                                                        </p>
                                                                        {sub_feild["options"].map((option, pkey) => {
                                                                            return (
                                                                                <label
                                                                                    htmlFor={option.parent_name + option.id}
                                                                                    className={`text-capitalize mr-1 ${sub_feild.value && (option.value == sub_feild.value) ? "checked" : ""} ${option.disable ? "disable" : ""}`}
                                                                                >
                                                                                    {option.label}
                                                                                </label>
                                                                            );
                                                                        })}
                                                                        {sub_feild.errors.map((error, eKey) => {
                                                                            return (
                                                                                <small
                                                                                key={eKey}
                                                                                className="text-danger animated flash"
                                                                                >
                                                                                {error.message}
                                                                                </small>
                                                                            );
                                                                        })}
                                                                        {sub_feild["img"] && <img src={sub_feild["img"][sub_feild.value]} style={{ width: "100%"}}/>}
                                                                    </div>
                                                                </div>
                                                            );
                                                        }
                                                        if (sub_feild['visible'] && sub_feild['element'] == 'select2') {
                                                            return <div className="mr-4" key={sub_feild.id} style={{paddingLeft:"15px"}}>
                                                                <p className="flat-label text-bold text-capitalize" dangerouslySetInnerHTML={{__html: sub_feild["label"]}}></p>
                                                                <p dangerouslySetInnerHTML={{__html: sub_feild["text"]}}></p>
                                                            </div>
                                                        }
                                                        if (sub_feild['visible'] && sub_feild['element'] == 'ckeditor') {                                                                                        
                                                            return <div className={sub_feild.feild_className}>
                                                                <p className="flat-label text-bold text-capitalize" dangerouslySetInnerHTML={{__html: sub_feild["label"]}}></p>
                                                                <p dangerouslySetInnerHTML={{__html: sub_feild["value"]}}></p>
                                                                {this.returnImages(sub_feild)}
                                                            </div>
                                                        }
                                                    })}
                                                </div>
                                            </>
                                            
                                        }

                                    }
                                    )}                                    
                                </div>
                            </span>}
                    })}
                </div>
            </div>
            
        </React.Fragment>)
    }
}

export default CS_Doctor_ERR_Assessment;
