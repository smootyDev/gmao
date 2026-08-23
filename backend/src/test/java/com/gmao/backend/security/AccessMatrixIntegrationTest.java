package com.gmao.backend.security;

import com.gmao.backend.auth.entity.Role;
import com.gmao.backend.auth.entity.User;
import com.gmao.backend.auth.repository.UserRepository;
import com.gmao.backend.workorders.entity.WorkOrder;
import com.gmao.backend.workorders.entity.WorkOrderStatus;
import com.gmao.backend.workorders.repository.WorkOrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
@AutoConfigureMockMvc
class AccessMatrixIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WorkOrderRepository workOrderRepository;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
        workOrderRepository.deleteAll();
        userRepository.save(User.builder().username("admin").employeeCode("E-ADM").firstName("A")
            .lastName("A").email("a@t.es").password("x").role(Role.ADMIN).active(true).build());
        userRepository.save(User.builder().username("manager").employeeCode("E-MAN").firstName("M")
            .lastName("M").email("m@t.es").password("x").role(Role.MANAGER).active(true).build());
        userRepository.save(User.builder().username("tech").employeeCode("E-TEC").firstName("T")
            .lastName("T").email("t@t.es").password("x").role(Role.TECH).active(true).build());
    }

    @Test
    void unauthenticatedRequestsGet401Json() throws Exception {
        mockMvc.perform(get("/api/assets"))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    @WithMockUser(roles = "TECH")
    void techIsDeniedAdminAndWriteEndpoints() throws Exception {
        mockMvc.perform(post("/api/users").contentType(MediaType.APPLICATION_JSON)
            .content("{\"username\":\"x\",\"role\":\"TECH\"}")).andExpect(status().isForbidden());
        mockMvc.perform(post("/api/workorders").contentType(MediaType.APPLICATION_JSON)
            .content("{\"title\":\"OT\"}")).andExpect(status().isForbidden());
        mockMvc.perform(post("/api/assets").contentType(MediaType.APPLICATION_JSON)
            .content("{\"name\":\"Activo\"}")).andExpect(status().isForbidden());
        mockMvc.perform(put("/api/assets/1").contentType(MediaType.APPLICATION_JSON)
            .content("{\"name\":\"Activo\"}")).andExpect(status().isForbidden());
        mockMvc.perform(delete("/api/assets/1")).andExpect(status().isForbidden());
        mockMvc.perform(delete("/api/inventory-items/1")).andExpect(status().isForbidden());
        mockMvc.perform(post("/api/preventive-plans/1/run")).andExpect(status().isForbidden());

        mockMvc.perform(get("/api/assets")).andExpect(status().isOk());
        mockMvc.perform(get("/api/workorders")).andExpect(status().isOk());
        mockMvc.perform(get("/api/users")).andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "MANAGER")
    void managerCanWriteButNotAdminActions() throws Exception {
        mockMvc.perform(get("/api/users")).andExpect(status().isOk());
        mockMvc.perform(post("/api/users").contentType(MediaType.APPLICATION_JSON)
            .content("{\"username\":\"x\",\"role\":\"TECH\"}")).andExpect(status().isForbidden());

        mockMvc.perform(post("/api/workorders").contentType(MediaType.APPLICATION_JSON)
            .content("{\"title\":\"OT manager\"}")).andExpect(status().isOk());
        mockMvc.perform(post("/api/assets").contentType(MediaType.APPLICATION_JSON)
            .content("{\"name\":\"Activo\"}")).andExpect(status().isOk());
        mockMvc.perform(delete("/api/assets/1")).andExpect(status().isForbidden());
        mockMvc.perform(delete("/api/asset-types/1")).andExpect(status().isForbidden());
        mockMvc.perform(delete("/api/locations/1")).andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void adminCanAccessEverything() throws Exception {
        mockMvc.perform(get("/api/users")).andExpect(status().isOk());
        mockMvc.perform(post("/api/users").contentType(MediaType.APPLICATION_JSON)
            .content("{\"username\":\"nuevo\",\"employeeCode\":\"E-N\",\"firstName\":\"N\",\"lastName\":\"N\",\"email\":\"n@t.es\",\"password\":\"x\",\"role\":\"TECH\"}"))
            .andExpect(status().isOk());
        mockMvc.perform(post("/api/workorders").contentType(MediaType.APPLICATION_JSON)
            .content("{\"title\":\"OT admin\"}")).andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "tech", roles = "TECH")
    void techCanOnlyUpdateAssignedWorkOrdersWithAllowedTransitions() throws Exception {
        User tech = userRepository.findByUsername("tech").orElseThrow();
        User admin = userRepository.findByUsername("admin").orElseThrow();
        WorkOrder mine = workOrderRepository.save(WorkOrder.builder()
            .title("Mi OT").status(WorkOrderStatus.ASSIGNED).assignedTo(tech.getId()).createdBy(admin.getId()).build());
        WorkOrder other = workOrderRepository.save(WorkOrder.builder()
            .title("OT ajena").status(WorkOrderStatus.ASSIGNED).assignedTo(admin.getId()).createdBy(admin.getId()).build());

        String valid = "{\"title\":\"Mi OT\",\"status\":\"IN_PROGRESS\"}";
        mockMvc.perform(put("/api/workorders/" + mine.getId()).contentType(MediaType.APPLICATION_JSON)
            .content(valid)).andExpect(status().isOk());

        String foreign = "{\"title\":\"OT ajena\",\"status\":\"IN_PROGRESS\"}";
        mockMvc.perform(put("/api/workorders/" + other.getId()).contentType(MediaType.APPLICATION_JSON)
            .content(foreign)).andExpect(status().isForbidden());

        String invalidTransition = "{\"title\":\"Mi OT\",\"status\":\"OPEN\"}";
        mockMvc.perform(put("/api/workorders/" + mine.getId()).contentType(MediaType.APPLICATION_JSON)
            .content(invalidTransition)).andExpect(status().isForbidden());

        String changePriority = "{\"title\":\"Mi OT\",\"status\":\"IN_PROGRESS\",\"priority\":1}";
        mockMvc.perform(put("/api/workorders/" + mine.getId()).contentType(MediaType.APPLICATION_JSON)
            .content(changePriority)).andExpect(status().isForbidden());

        String registerHours = "{\"title\":\"Mi OT\",\"status\":\"IN_PROGRESS\",\"actualHours\":4.5}";
        mockMvc.perform(put("/api/workorders/" + mine.getId()).contentType(MediaType.APPLICATION_JSON)
            .content(registerHours)).andExpect(status().isOk());
    }
}