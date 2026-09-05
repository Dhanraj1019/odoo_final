import supabase from './Supabase'

class Storage{
  async uploadFile({bucket,file,path}){
    const result = await supabase.storage.from(bucket).upload(path, file)
    if(result && result.error){
          console.log("error = ",result.error);
          return false;
      }
      else {
          return result.data;
      }
  }
  
  async deleteFile({bucket,path}){
    const result = await supabase.storage.from(bucket).remove([path]);
    if(result.error){
      console.log("error = ",result.error);
      return false;
    }
    else{
      return result;
    }
  }

  async getAllFiles({bucket}){
    const result = supabase.storage.from(bucket);
    if(result.error){
      console.log("error in getall files = ",result.error);
      return false;
    }
    return result;
  }
  async getFile({bucket,fileurl}){
    const result = supabase.storage.from(bucket).getPublicUrl(fileurl);
    return result;
  }

  getPublicUrl({bucket,path}){
    try {
      const { data } = supabase
        .storage
        .from(bucket)
        .getPublicUrl(path);
      return data;
    } catch (error) {
      console.log("error in getpublicurl function in storage.js", error);
      return null;
    }
  }
}

const StorageObj=new Storage();
export default StorageObj;