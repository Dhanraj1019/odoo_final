import { createSlice } from '@reduxjs/toolkit';

const initialState={
    status:false,
    user:null,
    session:null,
    role:"user"
}

const authSclice=createSlice({
    name:"auth",
    initialState,
    reducers:{
        login:(state,action)=>{
            state.status=true;
            const payload = action.payload || {};
            state.user = payload.user || payload;
            state.session = payload.session || null;
            state.role = payload.role || payload.user?.role || state.role || "user";
        },
        logout:(state)=>{
            state.status=false;
            state.user=null;
            state.session=null;
            state.role="user";
        }
    }
})

export const {login,logout} = authSclice.actions;
export default authSclice.reducer;